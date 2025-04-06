// External dependencies
import { _TypedDataEncoder } from '@ethersproject/hash'
import { constructSDK, permit2Address, zeroAddress } from '@orbs-network/liquidity-hub-sdk'
import { useMutation, useQuery } from '@tanstack/react-query'
import BN from 'bignumber.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'
import { useAccount } from 'wagmi'

// Internal imports
import { TXN_STATUS } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { readCall, signCall } from '@/lib/contractActions'
import { getERC20Contract, getWBNBContract } from '@/lib/contracts'
import { errorToast, successToast } from '@/lib/notify'
import { fromWei, toWei } from '@/lib/utils'
import { useSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'

// Relative imports
import { simulateOdosSwap } from '../../hooks/useSwap'

const NATIVE_TOKEN_SYMBOL = 'BNB'
const TOKEN_LIST = 'https://lhthena.s3.us-east-2.amazonaws.com/token-list-lh.json'

const TX_UPDATER_KEYS = {
  key: uuidv4(),
  wrap: uuidv4(),
  approve: uuidv4(),
  swap: uuidv4(),
}

export const subtractSlippage = (allowedSlippage, outAmount) => {
  if (!outAmount) return undefined

  return BN(outAmount)
    .multipliedBy(BN(10000 - allowedSlippage * 100))
    .div(BN(10000))
    .decimalPlaces(0)
    .toString()
}

const useWrappedNativeContract = () => {
  const { chainId } = useAccount()

  return useMemo(() => getWBNBContract(chainId), [chainId])
}

const useWrappedToken = () => {
  const baseAssets = useAssets()
  const wrappedNativeAddress = useWrappedNativeContract()?.address

  return useMemo(() => {
    if (!wrappedNativeAddress) return
    return baseAssets.find(asset => asset.address.toLowerCase() === wrappedNativeAddress.toLowerCase())
  }, [baseAssets, wrappedNativeAddress])
}

const isTxRejectedError = error => {
  const message = error.message?.toLowerCase()
  return message?.includes('rejected') || message?.includes('denied')
}

const isNative = address => {
  if (!address) return false
  return address === NATIVE_TOKEN_SYMBOL
}

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

const useSDK = () => {
  const { chainId } = useAccount()
  return useMemo(() => constructSDK({ chainId, partner: 'thena' }), [chainId])
}

const useGetQuoteCallback = () => {
  const { address: account } = useAccount()
  const wrappedNativeContract = useWrappedNativeContract()
  const { slippage } = useSettings()
  const sdk = useSDK()

  return useCallback(
    (fromAsset, toAsset, fromAmount, bestTrade, signal) =>
      sdk.getQuote({
        fromToken: isNative(fromAsset?.address) ? wrappedNativeContract?.address : fromAsset?.address,
        toToken: isNative(toAsset?.address) ? zeroAddress : toAsset?.address,
        inAmount: toWei(fromAmount, fromAsset?.decimals).decimalPlaces(0).toFixed(),
        account,
        slippage,
        dexMinAmountOut: bestTrade ? subtractSlippage(slippage, bestTrade.outAmounts[0]) : '-1',
        signal,
        timeout: 6_000,
      }),

    [sdk, wrappedNativeContract, account, slippage],
  )
}

const useOnTradeSuccess = (fromAsset, toAsset, isFallbackLH) => {
  const sdk = useSDK()
  const { slippage } = useSettings()

  const { mutate } = useMutation({
    mutationFn: async ({ quote, bestTrade, isTradeLH, fromAmount }) => {
      const outAmountDex = bestTrade?.outAmounts?.[0] || '0'
      const outAmountLH = quote?.outAmountWS || '0'
      const minAmountOutLH = quote?.userMinOutAmountWithGas || '0'
      const minAmountOutDex = subtractSlippage(slippage, outAmountDex) || '0'
      const outAmount = isTradeLH ? outAmountLH : outAmountDex
      const inAmountUsd = fromAmount * (fromAsset?.price || 0)
      const outAmountUsd = fromWei(outAmount, toAsset?.decimals) * (toAsset?.price || 0)
      sdk.analytics.onTradeSuccess({
        outAmountLH,
        outAmountDex,
        minAmountOutLH,
        minAmountOutDex,
        outAmountLhUI: fromWei(outAmountLH, toAsset?.decimals),
        outAmountDexUI: fromWei(outAmountDex, toAsset?.decimals),
        minAmountOutLhUI: fromWei(minAmountOutLH, toAsset?.decimals),
        minAmountOutDexUI: fromWei(minAmountOutDex, toAsset?.decimals),
        inAmountUsd,
        outAmountUsd,
        executor: isTradeLH ? 'lh' : 'dex',
        isFallbackLH,
      })
    },
    onError: error => {
      console.error(error)
    },
  })

  return mutate
}

const useTrade = (fromAsset, toAsset, fromAmountUI, enabled) => {
  const { address: account } = useAccount()
  const { slippage } = useSettings()
  const getQuoteCallback = useGetQuoteCallback()

  return useQuery({
    queryKey: ['liquidity-hub-trade', fromAsset?.address, toAsset?.address, fromAmountUI, slippage, account],
    queryFn: async ({ signal }) => {
      const quote = await getQuoteCallback(fromAsset, toAsset, fromAmountUI, undefined, signal)

      return {
        quote,
        outAmount: quote.outAmountWS,
        minAmountOut: quote.userMinOutAmountWithGas,
      }
    },
    refetchInterval: 10_000,
    enabled: Boolean(enabled && !!account && BN(fromAmountUI || 0).gt(0) && !!fromAsset && !!toAsset),
  })
}

const useSubmitTransaction = bestTrade => {
  const sdk = useSDK()
  const { account } = useWallet()
  const bestTradeRef = useRef(bestTrade)

  useEffect(() => {
    if (bestTrade) {
      bestTradeRef.current = bestTrade
    }
  }, [bestTrade])

  return useMutation({
    mutationFn: async ({ quote, signature }) => {
      let txData = { to: '', data: '' }
      try {
        if (!bestTradeRef.current) {
          throw new Error('No best trade')
        }
        txData = await simulateOdosSwap(account, bestTradeRef.current.pathId)
      } catch (error) {
        console.error('Simulate swap failed', error)
      }

      const txHash = await sdk.swap(quote, signature, txData)

      if (!txHash) {
        throw new Error('Missing txHash')
      }
      const tx = await sdk.getTransactionDetails(txHash, quote)
      if (!tx.isMined) {
        throw new Error('transaction failed onchain')
      }
      return txHash
    },
  })
}

const useInitSwap = (fromAsset, toAsset) => {
  const { startTxn } = useTxn()
  const wrappedTokenSymbol = useWrappedToken()?.symbol

  return useCallback(
    (isNativeIn, isApproved) => {
      startTxn({
        key: TX_UPDATER_KEYS.key,
        title: `Swap ${fromAsset.symbol} for ${toAsset.symbol}`,
        transactions: {
          ...(isNativeIn && {
            [TX_UPDATER_KEYS.wrap]: {
              desc: `Wrap ${fromAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isApproved && {
            [TX_UPDATER_KEYS.approve]: {
              desc: `Approve ${isNativeIn ? wrappedTokenSymbol : fromAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [TX_UPDATER_KEYS.swap]: {
            desc: `Swap ${isNativeIn ? wrappedTokenSymbol : fromAsset.symbol} for ${toAsset.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
    },
    [fromAsset, startTxn, toAsset, wrappedTokenSymbol],
  )
}

const useWrapCallback = () => {
  const wrappedNativeContract = useWrappedNativeContract()
  const sdk = useSDK()
  const { writeTxn } = useTxn()

  return useMutation({
    mutationFn: async fromAmount => {
      sdk.analytics.onWrapRequest()
      return writeTxn(TX_UPDATER_KEYS.key, TX_UPDATER_KEYS.wrap, wrappedNativeContract, 'deposit', [], fromAmount)
    },
    onSuccess: txHash => {
      sdk.analytics.onWrapSuccess(txHash)
    },
    onError: error => {
      sdk.analytics.onWrapFailure(error)
      return error
    },
  })
}

const useApproveCallback = () => {
  const { writeTxn } = useTxn()
  const sdk = useSDK()
  return useMutation({
    mutationFn: async tokenContract => {
      sdk.analytics.onApprovalRequest()

      return writeTxn(TX_UPDATER_KEYS.key, TX_UPDATER_KEYS.approve, tokenContract, 'approve', [
        permit2Address,
        maxUint256,
      ])
    },
    onSuccess: txHash => {
      sdk.analytics.onApprovalSuccess(txHash)
    },
    onError: error => {
      sdk.analytics.onApprovalFailed(error)
      return error
    },
  })
}

const useSignEip712Callback = () => {
  const sdk = useSDK()
  return useMutation({
    mutationFn: async quote => {
      const { eip712 } = quote
      const typedDataMessage = _TypedDataEncoder.getPayload(eip712.domain, eip712.types, eip712.message)
      return signCall(typedDataMessage)
    },
    onSuccess: signature => {
      sdk.analytics.onSignatureSuccess(signature)
    },
    onError: error => {
      sdk.analytics.onSignatureFailed(error.message)
      throw error
    },
  })
}

const useSwap = (fromAsset, toAsset, fromAmountUI, bestTrade, isFallbackLH) => {
  const { account, chainId } = useWallet()
  const { mutateAsync: submitTx } = useSubmitTransaction(bestTrade)
  const initStartTxn = useInitSwap(fromAsset, toAsset)
  const { updateTxn, endTxn, closeTxn } = useTxn()
  const { mutateAsync: wrapCallback } = useWrapCallback()
  const { mutateAsync: approveCallback } = useApproveCallback()
  const { mutateAsync: signEip712Callback } = useSignEip712Callback()
  const wrappedNativeContract = useWrappedNativeContract()
  const getQuoteCallback = useGetQuoteCallback()

  return useMutation({
    mutationFn: async ({ quote: currentQuote }) => {
      const isNativeIn = isNative(fromAsset.address)
      const inTokenAddress = isNativeIn ? wrappedNativeContract?.address : fromAsset.address
      const fromAmount = toWei(fromAmountUI, fromAsset?.decimals).decimalPlaces(0).toFixed()
      const tokenContract = getERC20Contract(inTokenAddress, chainId)
      const allowance = await readCall(tokenContract, 'allowance', [account, permit2Address])
      const isApproved = new BN(allowance).gte(fromAmount)
      initStartTxn(isNativeIn, isApproved)

      if (isNativeIn) {
        await wrapCallback(fromAmount)
      }

      if (!isApproved) {
        await approveCallback(tokenContract)
      }

      // Refetch to get the latest quote
      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.swap,
        status: TXN_STATUS.WAITING,
      })

      let quote = currentQuote
      if (!quote || isNativeIn || !isApproved) {
        try {
          quote = await getQuoteCallback(fromAsset, toAsset, fromAmountUI, isFallbackLH ? undefined : bestTrade)
        } catch (error) {
          console.error('Failed to refetch quote', error)
        }
      }

      const signature = await signEip712Callback(quote)
      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.swap,
        status: TXN_STATUS.PENDING,
      })

      const txHash = await submitTx({
        signature,
        quote,
      })

      return txHash
    },
    onSuccess: (txHash, args) => {
      args.onSuccess()
      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.swap,
        status: TXN_STATUS.SUCCESS,
      })

      endTxn({
        key: TX_UPDATER_KEYS.key,
        final: 'Swapped Successfully',
      })
      successToast('Transaction confirmed', txHash)
    },
    onError: (error, args) => {
      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.swap,
        status: TXN_STATUS.FAILED,
      })

      if (isTxRejectedError(error)) {
        errorToast('Error', 'User rejected the transaction')
      } else {
        console.log({ error })
        errorToast('Error', 'Transaction failed')
        closeTxn()
        args.onError()
      }
    },
  })
}

const useCompareTrade = (fromAsset, toAsset, fromAmountUI, bestTrade, skip) => {
  const [isLoading, setIsLoading] = useState(false)
  const { liquidityHubEnabled, slippage } = useSettings()
  const getQuoteCallback = useGetQuoteCallback()

  const callback = useCallback(async () => {
    try {
      if (!liquidityHubEnabled || skip) return
      setIsLoading(true)
      const quote = await getQuoteCallback(fromAsset, toAsset, fromAmountUI, bestTrade)
      const dexMinAmountOut = subtractSlippage(slippage, bestTrade?.outAmounts[0])

      return {
        isLH: BN(quote?.userMinOutAmountWithGas || 0).gt(dexMinAmountOut),
        quote,
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [liquidityHubEnabled, getQuoteCallback, fromAsset, toAsset, fromAmountUI, bestTrade, slippage, skip])
  return {
    callback,
    isLoading,
  }
}

export const liquidityHub = {
  getTokens,
  useTrade,
  useSwap,
  useCompareTrade,
  useOnTradeSuccess,
}
