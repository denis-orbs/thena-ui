/* eslint-disable class-methods-use-this */
import { _TypedDataEncoder } from '@ethersproject/hash'
import { useMutation, useQuery } from '@tanstack/react-query'
import BN from 'bignumber.js'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256, zeroAddress } from 'viem'
import { getEnsAddress } from 'viem/actions'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { TXN_STATUS } from '@/constant'
import { readCall, signCall, waitCall } from '@/lib/contractActions'
import { getERC20Contract, getWBNBContract } from '@/lib/contracts'
import { errorToast, successToast } from '@/lib/notify'
import { formatAmount, isInvalidAmount, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'

const permit2Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3'
const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
const NATIVE_TOKEN_SYMBOL = 'BNB'
const CHAIN_ID = 56
const PARTNER = 'Thena'
const API_ENDPOINT = 'https://hub.orbs.network'
const TOKEN_LIST = 'https://lhthena.s3.us-east-2.amazonaws.com/token-list-lh.json'
const zero = BN(0)

// analytics
const ANALYTICS_VERSION = 0.1
const TX_UPDATER_KEYS = {
  key: uuidv4(),
  swapuuid: uuidv4(),
  approveuuid: uuidv4(),
  wrapuuid: uuidv4(),
  signuuid: uuidv4(),
}

const initialAnalyticsData = {
  _id: crypto.randomUUID(),
  partner: PARTNER,
  chainId: CHAIN_ID,
  isClobTrade: false,
  isNotClobTradeReason: 'null',
  firstFailureSessionId: 'null',
  clobDexPriceDiffPercent: 'null',
  approvalState: 'null',
  signatureState: 'null',
  swapState: 'null',
  wrapState: 'null',
  onChainClobSwapState: 'null',
  userWasApprovedBeforeTheTrade: 'null',
  isDexTrade: false,
  version: ANALYTICS_VERSION,
}

const dexAmountOutWithSlippage = (outAmount, slippage) => {
  if (!outAmount) return ''
  return BN(outAmount || '0')
    .times(100 - slippage)
    .div(100)
    .toString()
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

const LH_CONTROL = {
  FORCE: '1',
  SKIP: '2',
  RESET: '3',
}

class Analytics {
  firstFailureSessionId = null

  abortController = new AbortController()

  updateAndSend(values = {}) {
    try {
      this.abortController.abort()
      this.abortController = new AbortController()
      this.data = { ...this.data, ...values }
      fetch(`https://bi.orbs.network/putes/liquidity-hub-ui-${ANALYTICS_VERSION}`, {
        method: 'POST',
        signal: this.abortController.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.data),
      }).catch(e => {
        console.log('Analytics error', e)
      })
    } catch (error) {
      return undefined
    }
  }

  onNotClobTrade(message) {
    this.updateAndSend({ isNotClobTradeReason: message })
  }

  onApprovedBeforeTheTrade(userWasApprovedBeforeTheTrade) {
    this.updateAndSend({ userWasApprovedBeforeTheTrade })
  }

  onDexSwapRequest() {
    this.updateAndSend({ dexSwapState: 'pending', isDexTrade: true })
  }

  onDexSwapSuccess(response) {
    this.updateAndSend({
      dexSwapState: 'success',
      dexSwapTxHash: response.hash,
    })
  }

  onDexSwapFailed(dexSwapError) {
    this.updateAndSend({ dexSwapState: 'failed', dexSwapError })
  }

  onApprovalRequest() {
    this.updateAndSend({ approvalState: 'pending' })
  }

  onApprovalSuccess(time) {
    this.updateAndSend({ approvalMillis: time, approvalState: 'success' })
  }

  onApprovalFailed(error, time) {
    this.updateAndSend({
      approvalError: error,
      approvalState: 'failed',
      approvalMillis: time,
      isNotClobTradeReason: 'approval failed',
    })
  }

  onWrapRequest() {
    this.updateAndSend({ wrapState: 'pending' })
  }

  onWrapSuccess(txHash, time) {
    this.updateAndSend({
      wrapTxHash: txHash,
      wrapMillis: time,
      wrapState: 'success',
    })
  }

  onWrapFailed(error, time) {
    this.updateAndSend({
      wrapError: error,
      wrapState: 'failed',
      wrapMillis: time,
      isNotClobTradeReason: 'wrap failed',
    })
  }

  onSignatureRequest() {
    this.updateAndSend({
      signatureState: 'pending',
    })
  }

  onSignatureSuccess(signature, time) {
    this.updateAndSend({
      signature,
      signatureMillis: time,
      signatureState: 'success',
    })
  }

  onSignatureFailed(error, time) {
    this.updateAndSend({
      signatureError: error,
      signatureState: 'failed',
      signatureMillis: time,
      isNotClobTradeReason: 'signature failed',
    })
  }

  onSwapRequest() {
    this.updateAndSend({ swapState: 'pending' })
  }

  onSwapSuccess(txHash, time) {
    this.updateAndSend({
      txHash,
      swapMillis: time,
      swapState: 'success',
      isClobTrade: true,
      onChainClobSwapState: 'pending',
    })
  }

  onSwapFailed(error, time) {
    this.updateAndSend({
      swapError: error,
      swapState: 'failed',
      swapMillis: time,
      isNotClobTradeReason: 'swap failed',
    })
  }

  setSessionId(id) {
    this.data.sessionId = id
  }

  initSwap({ fromAmount, fromAsset, toAsset, dexOutAmount, toAmount, lhQuote, slippage, isDexTrade }) {
    const dstTokenUsdValue = new BN(toAmount).multipliedBy(toAsset?.price || 0).toNumber()
    this.data = {
      ...initialAnalyticsData,
      _id: crypto.randomUUID(),
      firstFailureSessionId: this.firstFailureSessionId,
    }

    const dexAmountOut = dexAmountOutWithSlippage(dexOutAmount, slippage)
    const clobAmountOut = lhQuote?.outAmount || '0'

    const clobDexPriceDiffPercent = () => {
      if (dexAmountOut === '0') {
        return 100
      }
      if (clobAmountOut === '0') {
        return -100
      }
      // eslint-disable-next-line newline-per-chained-call
      return new BN(clobAmountOut).dividedBy(new BN(dexAmountOut)).minus(1).multipliedBy(100).toFixed(2)
    }
    this.updateAndSend({
      dexAmountOut,
      dstTokenUsdValue,
      srcTokenAddress: isNative(fromAsset?.address) ? zeroAddress : fromAsset?.address,
      srcTokenSymbol: fromAsset?.symbol,
      dstTokenAddress: isNative(toAsset?.address) ? zeroAddress : toAsset?.address,
      dstTokenSymbol: toAsset?.symbol,
      srcAmount: fromAmount,
      slippage,
      isDexTrade,
      clobDexPriceDiffPercent: clobDexPriceDiffPercent(),
    })
  }

  onClobFailure() {
    this.firstFailureSessionId = this.firstFailureSessionId || this.data.sessionId || ''
  }
}

export const analytics = new Analytics()

const LhQuote = async args => {
  try {
    const dexOutAmount = dexAmountOutWithSlippage(args.dexAmountOut, args.slippage)

    const response = await fetch(`${API_ENDPOINT}/quote?chainId=${CHAIN_ID}`, {
      method: 'POST',
      body: JSON.stringify({
        inToken: isNative(args.inToken) ? zeroAddress : args.inToken,
        outToken: isNative(args.outToken) ? zeroAddress : args.outToken,
        inAmount: args.inAmount,
        outAmount: !dexOutAmount ? '-1' : new BN(dexOutAmount).gt(0) ? dexOutAmount : '0',
        user: args.account,
        slippage: args.slippage,
        qs: encodeURIComponent(window.location.hash),
        partner: PARTNER.toLowerCase(),
      }),
      signal: args.signal,
    })
    const result = await response.json()
    if (!result) {
      throw new Error('No result')
    }
    if (result.error === 'tns') {
      return {
        outAmount: '0',
      }
    }

    if (!result.outAmount || new BN(result.outAmount).eq(0)) {
      throw new Error('No liquidity')
    }

    return result
  } catch (error) {
    throw new Error(error.message)
  }
}

const useStore = create(set => ({
  isFailed: false,
  failures: 0,
  updateState: values => set({ ...values }),
  incrementFailures: () =>
    set(state => {
      const failures = state.failures + 1
      return {
        failures,
        isFailed: failures > 2,
      }
    }),
}))

export const usePersistedStore = create(
  persist(
    (set, get) => ({
      lhControl: undefined,
      setLHControl: lhControl => set({ lhControl }),
      liquidityHubEnabled: true,
      updateLiquidityHubEnabled: () => set({ liquidityHubEnabled: !get().liquidityHubEnabled }),
    }),
    {
      name: 'lhControl',
    },
  ),
)

const amountBN = (token, amount) => parsebn(amount).times(BN(10).pow(token?.decimals || 0))
const amountUi = (token, amount) => {
  if (!token) return ''
  const percision = BN(10).pow(token?.decimals || 0)
  return amount.times(percision).idiv(percision).div(percision).toString()
}
const getTokens = async liquidityHubEnabled => {
  if (!liquidityHubEnabled) {
    return []
  }
  try {
    const data = await fetch(TOKEN_LIST).then(res => res.json())
    return data.tokens
  } catch (error) {
    return []
  }
}

const counter = () => {
  const now = Date.now()

  return () => Date.now() - now
}

export const useLHControl = () => {
  const searchParams = useSearchParams()
  const { setLHControl, lhControl } = usePersistedStore()
  const _lhControl = useMemo(() => searchParams.get('liquidity-hub')?.toLowerCase(), [searchParams])

  useEffect(() => {
    if (!_lhControl) return
    if (_lhControl === LH_CONTROL.RESET) {
      setLHControl(undefined)
      return
    }
    setLHControl(_lhControl)
  }, [_lhControl, setLHControl])

  return lhControl
}

const useQuoteQuery = (fromAsset, toAsset, fromAmount = '', dexAmountOut = '') => {
  const { slippage } = useSettings()
  const { liquidityHubEnabled } = usePersistedStore()
  const { account } = useWallet()
  const { isFailed } = useStore()
  const [error, setError] = useState(false)

  const fromAddress = fromAsset?.address || ''
  const toAddress = toAsset?.address || ''
  const query = useQuery({
    queryKey: ['useLHQuoteQuery', fromAddress, toAddress, fromAmount, slippage, account],
    queryFn: async ({ signal }) =>
      LhQuote({
        inToken: fromAsset.address,
        outToken: toAsset.address,
        inAmount: amountBN(fromAsset, fromAmount).toString(),
        dexAmountOut,
        slippage,
        account,
        signal,
      }),
    refetchInterval: 10_000,
    enabled: !!account && !isInvalidAmount(fromAmount) && !!fromAsset && !!toAsset && !isFailed && liquidityHubEnabled,
    gcTime: 0,
    retry: 2,
    initialData: isFailed || !liquidityHubEnabled ? { outAmount: '' } : undefined,
  })

  useEffect(() => {
    if (query.isError) {
      setError(true)
    }
  }, [query.isError])

  useEffect(
    () => () => {
      setError(false)
    },
    [fromAddress, toAddress, fromAmount, slippage, account],
  )

  return { ...query, error, isLoading: error ? false : query.isLoading }
}

const useSubmitTransaction = () => {
  const { account } = useWallet()
  const { updateTxn } = useTxn()

  return useCallback(
    async args => {
      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.swapuuid,
        status: TXN_STATUS.PENDING,
      })
      const count = counter()
      analytics.onSwapRequest()
      try {
        const txHashResponse = await fetch(`${API_ENDPOINT}/swapx?chainId=${CHAIN_ID}`, {
          method: 'POST',
          body: JSON.stringify({
            inToken: args.srcToken,
            outToken: args.destToken,
            inAmount: args.srcAmount,
            user: account,
            signature: args.signature,
            ...args.quote,
          }),
        })
        const swap = await txHashResponse.json()

        if (!swap) {
          throw new Error('Missing swap response')
        }

        if (swap.error || (swap.message && !swap.txHash)) {
          throw new Error(swap)
        }

        if (!swap.txHash) {
          throw new Error('Missing txHash')
        }

        const tx = await waitCall(swap.txHash)
        updateTxn({
          key: TX_UPDATER_KEYS.key,
          uuid: TX_UPDATER_KEYS.swapuuid,
          status: TXN_STATUS.SUCCESS,
          hash: swap.txHash,
        })
        analytics.onSwapSuccess(swap.txHash, count())
        successToast('Transaction confirmed', swap.txHash)
        return tx
      } catch (error) {
        console.log({ error })
        updateTxn({
          key: TX_UPDATER_KEYS.key,
          uuid: TX_UPDATER_KEYS.swapuuid,
          status: TXN_STATUS.FAILED,
        })
        analytics.onSwapFailed(error.message, count())
        errorToast('Transaction failed', 'error')
        throw new Error(error.message)
      }
    },
    [account, updateTxn],
  )
}

const useSwap = () => {
  const { account, chainId } = useWallet()
  const count = counter()
  const submitTx = useSubmitTransaction()
  const { incrementFailures } = useStore()
  const { startTxn, writeTxn, updateTxn, endTxn } = useTxn()

  return useMutation({
    mutationFn: async ({ fromAsset, toAsset, fromAmount, setFromAddress, quote, callback }) => {
      if (!quote) {
        return
      }
      const isNativeIn = isNative(fromAsset.address)
      const isNativeOut = isNative(toAsset.address)

      const inTokenAddress = isNativeIn ? zeroAddress : fromAsset.address
      const outTokenAddress = isNativeOut ? zeroAddress : toAsset.address

      const inAmountBN = amountBN(fromAsset, fromAmount).toString()
      const toAmount = amountUi(toAsset, new BN(quote?.outAmount))

      const tokenContract = getERC20Contract(inTokenAddress, chainId)
      const allowance = await readCall(tokenContract, 'allowance', [account, permit2Address])
      const isApproved = new BN(allowance).gte(inAmountBN)

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
            desc: `Swap ${formatAmount(fromAmount)} ${fromAsset.symbol} for ${formatAmount(toAmount)} ${
              toAsset.symbol
            }`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      // Wrap
      if (isNativeIn) {
        const wbnbContract = getWBNBContract(chainId)
        const txHash = await writeTxn(
          TX_UPDATER_KEYS.key,
          TX_UPDATER_KEYS.wrapuuid,
          wbnbContract,
          'deposit',
          [],
          toWei(fromAmount).toFixed(0),
        )
        if (!txHash) {
          analytics.onWrapFailed('Wrap failed', count())
          return
        }
        setFromAddress(WBNB_ADDRESS)
        analytics.onWrapSuccess(txHash, count())
      }

      // Approve
      analytics.onApprovedBeforeTheTrade(isApproved)
      if (!isApproved) {
        const txHash = await writeTxn(TX_UPDATER_KEYS.key, TX_UPDATER_KEYS.approveuuid, tokenContract, 'approve', [
          permit2Address,
          maxUint256,
        ])
        if (!txHash) {
          analytics.onApprovalFailed('Approve failed', count())
          return
        }
        analytics.onApprovalSuccess(count())
      }

      // Sign

      analytics.onSignatureRequest()
      let signature
      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.signuuid,
        status: TXN_STATUS.WAITING,
      })
      try {
        process.env.DEBUG = 'web3-candies'

        const { permitData } = quote
        const populated = await _TypedDataEncoder.resolveNames(
          permitData.domain,
          permitData.types,
          permitData.values,
          async name => getEnsAddress(name),
        )
        const typedDataMessage = _TypedDataEncoder.getPayload(populated.domain, permitData.types, populated.value)
        signature = await signCall(typedDataMessage)
        updateTxn({
          key: TX_UPDATER_KEYS.key,
          uuid: TX_UPDATER_KEYS.signuuid,
          status: TXN_STATUS.SUCCESS,
        })
        successToast('Signature success')
        analytics.onSignatureSuccess(signature, count())
      } catch (error) {
        updateTxn({
          key: TX_UPDATER_KEYS.key,
          uuid: TX_UPDATER_KEYS.signuuid,
          status: TXN_STATUS.FAILED,
        })
        analytics.onSignatureFailed(error.message, count())
        errorToast('Signature failed', 'error')
        throw new Error(error.message)
      }

      updateTxn({
        key: TX_UPDATER_KEYS.key,
        uuid: TX_UPDATER_KEYS.swapuuid,
        status: TXN_STATUS.WAITING,
      })
      const tx = await submitTx({
        srcToken: inTokenAddress,
        destToken: outTokenAddress,
        srcAmount: inAmountBN,
        signature,
        quote,
      })
      endTxn({
        key: TX_UPDATER_KEYS.key,
        final: 'Swap Successful',
      })
      callback()
      return tx
    },
    onError: () => {
      incrementFailures()
      analytics.onClobFailure()
    },
  })
}

const useIsDexTrade = (dexOutAmount, lhOutAmount, lhQuoteError) => {
  const lhControl = useLHControl()
  const { isFailed } = useStore()
  const { liquidityHubEnabled } = usePersistedStore()
  return useMemo(() => {
    if (!dexOutAmount || (!lhOutAmount && liquidityHubEnabled)) return
    if (lhQuoteError) return true
    const isDexTrade = new BN(dexOutAmount).gt(new BN(lhOutAmount || '0'))
    if (lhControl === LH_CONTROL.SKIP || !liquidityHubEnabled) {
      return true
    }
    if (lhControl === LH_CONTROL.FORCE) {
      console.log('LH force mode on')
      return false
    }
    if (isFailed) {
      return true
    }

    return isDexTrade
  }, [dexOutAmount, lhOutAmount, lhQuoteError, lhControl, isFailed, liquidityHubEnabled])
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
  useIsDexTrade,
  analytics,
  useLiquidtyHubSettings,
}
