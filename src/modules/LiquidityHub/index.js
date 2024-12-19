/* eslint-disable class-methods-use-this */
import { _TypedDataEncoder } from '@ethersproject/hash'
import { constructSDK, permit2Address, zeroAddress } from '@orbs-network/liquidity-hub-sdk'
import { useMutation, useQuery } from '@tanstack/react-query'
import BN from 'bignumber.js'
import { useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'
import { useAccount } from 'wagmi'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { TXN_STATUS } from '@/constant'
import useWallet from '@/hooks/useWallet'
import { readCall, signCall } from '@/lib/contractActions'
import { getERC20Contract, getWBNBContract } from '@/lib/contracts'
import { errorToast, successToast } from '@/lib/notify'
import { isInvalidAmount, toWei } from '@/lib/utils'
import { useSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'

import { promiseWithTimeout, subtractSlippage } from './utils'
import { simulateOdosSwap } from '../../hooks/useSwap'

const NATIVE_TOKEN_SYMBOL = 'BNB'
const PARTNER = 'Thena'
const TOKEN_LIST = 'https://lhthena.s3.us-east-2.amazonaws.com/token-list-lh.json'
const zero = BN(0)

const TX_UPDATER_KEYS = {
  key: uuidv4(),
  swapuuid: uuidv4(),
  approveuuid: uuidv4(),
  wrapuuid: uuidv4(),
  signuuid: uuidv4(),
}

const nativeTokenAddresses = [
  zeroAddress,
  '0x0000000000000000000000000000000000001010',
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  '0x000000000000000000000000000000000000dEaD',
  '0x000000000000000000000000000000000000800A',
]

function eqIgnoreCase(a, b) {
  return a === b || a.toLowerCase() === b.toLowerCase()
}

const isNativeAddress = address => !!nativeTokenAddresses.find(a => eqIgnoreCase(a, address))

const isNative = address => address === NATIVE_TOKEN_SYMBOL || isNativeAddress(address)

function bn(n, base) {
  if (n instanceof BN) return n
  if (!n) return zero
  return BN(n, base)
}

function parsebn(n, defaultValue, fmt) {
  if (typeof n !== 'string') return bn(n)

  const decimalSeparator = fmt?.decimalSeparator || '.'
  const str = n.replace(new RegExp(`[^${decimalSeparator}\\d-]+`, 'g'), '')
  const result = bn(decimalSeparator === '.' ? str : str.replace(decimalSeparator, '.'))
  if (defaultValue && (!result.isFinite() || result.lte(zero))) return defaultValue
  return result
}

export const useStore = create(set => ({
  seekingBetterPrice: false,
  setSeekingBetterPrice: seekingBetterPrice => set({ seekingBetterPrice }),
}))

export const usePersistedStore = create(
  persist(
    (set, get) => ({
      liquidityHubEnabled: true,
      updateLiquidityHubEnabled: () => set({ liquidityHubEnabled: !get().liquidityHubEnabled }),
    }),
    {
      name: 'lhPersistedStore',
    },
  ),
)

const amountBN = (token, amount) => parsebn(amount).times(BN(10).pow(token?.decimals || 0))

const getTokens = async liquidityHubEnabled => {
  if (!liquidityHubEnabled) {
    return []
  }
  try {
    const data = await fetch(TOKEN_LIST).then(res => res.json())
    return data.tokens.map(it => ({ ...it, extended: true }))
  } catch (error) {
    return []
  }
}

const useLiquidityHubSdk = () => {
  const { chainId } = useAccount()
  return useMemo(() => constructSDK({ chainId, partner: PARTNER.toLowerCase() }), [chainId])
}

// TODO: make sure extended tokens use this quote and shows in the UI because Thena won't have a price for it
const useQuoteQuery = ({ fromAsset, toAsset, fromAmount = '', bestTrade }) => {
  const dexMinAmountOut = bestTrade?.outAmounts[0]
  const { chainId } = useAccount()
  const wbnbContract = getWBNBContract(chainId)
  const { slippage } = useSettings()
  const { account } = useWallet()
  const fromAddress = isNative(fromAsset?.address || '') && wbnbContract ? wbnbContract.address : fromAsset?.address
  const toAddress = isNative(toAsset?.address || '') ? zeroAddress : toAsset?.address
  const isLHToken = Boolean(fromAsset?.extended || toAsset?.extended)
  const enabled = isLHToken
  const lhSdk = useLiquidityHubSdk()

  const query = useQuery({
    queryKey: ['useLHQuoteQuery', fromAddress, toAddress, fromAmount, slippage, account],
    queryFn: async ({ signal }) =>
      lhSdk.getQuote({
        fromToken: fromAddress,
        toToken: toAddress,
        inAmount: amountBN(fromAsset, fromAmount).dp(0).toString(),
        account,
        slippage,
        dexMinAmountOut: subtractSlippage(slippage, dexMinAmountOut),
        signal,
      }),
    refetchInterval: 10_000,
    enabled: enabled && !!account && !isInvalidAmount(fromAmount) && !!fromAsset && !!toAsset,
    gcTime: 0,
    retry: isLHToken ? 3 : 0,
  })

  const refetch = useCallback(async () => {
    const refetchFn = async () => (await query.refetch()).data
    return await promiseWithTimeout(refetchFn(), 9_000)
  }, [query])

  return { ...query, refetch }
}

const useSimulateOdosSwap = () => {
  const { account } = useWallet()

  return useCallback(
    async bestTrade => {
      try {
        if (!bestTrade) {
          throw new Error('Missing bestTrade')
        }
        return await simulateOdosSwap(account, bestTrade.pathId)
      } catch (error) {
        return { to: '', data: '' }
      }
    },
    [account],
  )
}

const useSubmitTransaction = () => {
  const { updateTxn } = useTxn()
  const simulateSwap = useSimulateOdosSwap()
  const lhSdk = useLiquidityHubSdk()

  return useCallback(
    async ({ quote, signature, getBestTrade }) => {
      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.swapuuid,
        status: TXN_STATUS.PENDING,
      })
      const bestTrade = getBestTrade()
      const { to, data } = await simulateSwap(bestTrade)

      try {
        const txHash = await lhSdk.swap(quote, signature, { to, data })

        if (!txHash) {
          throw new Error('Missing txHash')
        }
        const tx = await lhSdk.getTransactionDetails(txHash, quote)
        if (!tx) {
          throw new Error('transaction failed')
        }

        updateTxn({
          key: TX_UPDATER_KEYS.key,
          uuid: TX_UPDATER_KEYS.swapuuid,
          status: TXN_STATUS.SUCCESS,
          hash: txHash,
        })

        successToast('Transaction confirmed', txHash)
        return tx
      } catch (error) {
        console.log({ error })
        updateTxn({
          key: TX_UPDATER_KEYS.key,
          uuid: TX_UPDATER_KEYS.swapuuid,
          status: TXN_STATUS.FAILED,
        })
        errorToast('Transaction failed', 'error')
        throw new Error(error.message)
      }
    },
    [lhSdk, updateTxn, simulateSwap],
  )
}

const useSwap = () => {
  const { account, chainId } = useWallet()
  const submitTx = useSubmitTransaction()
  const { startTxn, writeTxn, updateTxn, endTxn } = useTxn()
  const lhSdk = useLiquidityHubSdk()

  return useMutation({
    mutationFn: async ({ getBestTrade, fromAsset, toAsset, fromAmount, refetchLHQuote, onSuccess, quote: _quote }) => {
      const isNativeIn = isNative(fromAsset.address)
      const wbnbContract = getWBNBContract(chainId)
      const inTokenAddress = isNativeIn ? wbnbContract.address : fromAsset.address
      const inAmountBN = amountBN(fromAsset, fromAmount).toString()
      const tokenContract = getERC20Contract(inTokenAddress, chainId)
      const allowance = await readCall(tokenContract, 'allowance', [account, permit2Address])
      const isApproved = new BN(allowance).gte(inAmountBN)
      let quote = _quote
      const shouldRefetchQuote = isNativeIn || !isApproved

      startTxn({
        key: TX_UPDATER_KEYS.key,
        title: `Swap ${fromAsset.symbol} for ${toAsset.symbol}`,
        transactions: {
          ...(isNativeIn && {
            [TX_UPDATER_KEYS.wrapuuid]: {
              desc: 'Wrap',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isApproved && {
            [TX_UPDATER_KEYS.approveuuid]: {
              desc: `Approve ${fromAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [TX_UPDATER_KEYS.signuuid]: {
            desc: 'Sign',
            status: TXN_STATUS.START,
            hash: null,
          },
          [TX_UPDATER_KEYS.swapuuid]: {
            desc: `Swap ${fromAsset.symbol} for ${toAsset.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      // Wrap
      if (isNativeIn) {
        try {
          lhSdk.analytics.onWrapRequest()
          const txHash = await writeTxn(
            TX_UPDATER_KEYS.key,
            TX_UPDATER_KEYS.wrapuuid,
            wbnbContract,
            'deposit',
            [],
            toWei(fromAmount).toFixed(0),
          )
          if (!txHash) {
            lhSdk.analytics.onWrapFailure('Wrap failed')
            return
          }
          lhSdk.analytics.onWrapSuccess()
        } catch (error) {
          lhSdk.analytics.onWrapFailure(error)
          return error
        }
      }

      // Approve
      if (!isApproved) {
        lhSdk.analytics.onApprovalRequest()
        try {
          const txHash = await writeTxn(TX_UPDATER_KEYS.key, TX_UPDATER_KEYS.approveuuid, tokenContract, 'approve', [
            permit2Address,
            maxUint256,
          ])
          if (!txHash) {
            lhSdk.analytics.onApprovalFailed('Approve failed')
            return
          }
          lhSdk.analytics.onApprovalSuccess(txHash)
        } catch (error) {
          lhSdk.analytics.onApprovalFailed(error)
          return error
        }
      }

      // Sign
      lhSdk.analytics.onSignatureRequest()
      let signature
      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.signuuid,
        status: TXN_STATUS.WAITING,
      })
      if (shouldRefetchQuote) {
        quote = await refetchLHQuote()
      }

      if (!quote) {
        throw new Error('Quote not found')
      }

      try {
        const populated = await _TypedDataEncoder.resolveNames(
          quote.permitData.domain,
          quote.permitData.types,
          quote.permitData.values,
          async name => name,
        )
        const typedDataMessage = _TypedDataEncoder.getPayload(populated.domain, quote.permitData.types, populated.value)
        signature = await signCall(typedDataMessage)
        updateTxn({
          key: TX_UPDATER_KEYS.key,
          uuid: TX_UPDATER_KEYS.signuuid,
          status: TXN_STATUS.SUCCESS,
        })
        successToast('Signature success')
        lhSdk.analytics.onSignatureSuccess(signature)
      } catch (error) {
        updateTxn({
          key: TX_UPDATER_KEYS.key,
          uuid: TX_UPDATER_KEYS.signuuid,
          status: TXN_STATUS.FAILED,
        })
        lhSdk.analytics.onSignatureFailed(error.message)
        errorToast('Signature failed', 'error')
        throw error
      }

      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.swapuuid,
        status: TXN_STATUS.WAITING,
      })
      const tx = await submitTx({
        signature,
        quote,
        getBestTrade,
      })
      endTxn({
        key: TX_UPDATER_KEYS.key,
        final: 'Swap Successful',
      })
      onSuccess()
      return tx
    },
    onError: (error, args) => {
      if (!error.message.includes('rejected')) {
        args.onFailure(error)
      }
    },
  })
}

const useGetBetterPrice = fetchLiquidityHubQuote => {
  const setSeekingBestPrice = useStore(state => state.setSeekingBetterPrice)
  const { liquidityHubEnabled } = usePersistedStore()
  const { slippage } = useSettings()

  return useCallback(
    async (dexOutAmount = '', skip = false) => {
      try {
        if (!liquidityHubEnabled || skip) return
        setSeekingBestPrice(true)
        const quote = await fetchLiquidityHubQuote()
        const dexMinAmountOut = subtractSlippage(slippage, dexOutAmount) || 0
        return BN(quote?.userMinOutAmountWithGas || 0).gt(dexMinAmountOut) ? quote : undefined
      } catch (error) {
        console.error(error)
      } finally {
        setTimeout(() => {
          setSeekingBestPrice(false)
        }, 200)
      }
    },
    [fetchLiquidityHubQuote, setSeekingBestPrice, slippage, liquidityHubEnabled],
  )
}

const useLiquidtyHubSettings = () => {
  const { liquidityHubEnabled } = usePersistedStore()

  return {
    liquidityHubEnabled,
  }
}

export const liquidityHub = {
  getTokens,
  useQuoteQuery,
  useSwap,
  useLiquidtyHubSettings,
  useGetBetterPrice,
  promiseWithTimeout,
}
