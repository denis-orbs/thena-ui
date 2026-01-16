import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { TRADE_TYPE } from '@/constant/swap/constants'
import useCommandsInput from '@/hooks/swap/useCommandsInput'
import useWallet from '@/hooks/useWallet'
import { getTradingRoute } from '@/lib/api'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, geUniversalRouterContract } from '@/lib/contracts'
import { useSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'
import { fromWei, toWei } from '@/utils/utils'

export const subtractSlippage = (allowedSlippage, outAmount) => {
  if (!outAmount) return undefined
  return BigNumber(outAmount)
    .multipliedBy(BigNumber(10000 - allowedSlippage * 100))
    .div(BigNumber(10000))
    .toString()
}

const useTrade = (fromAsset, toAsset, fromAmountUI, enabled, slippage) =>
  useQuery({
    queryKey: ['the-fallback-trade', fromAsset?.address, toAsset?.address, fromAmountUI],
    queryFn: async () => {
      const tokenIn = fromAsset.address === 'BNB' ? Contracts.WBNB[fromAsset.chainId]?.toLowerCase() : fromAsset.address
      const tokenOut = toAsset.address === 'BNB' ? Contracts.WBNB[toAsset.chainId]?.toLowerCase() : toAsset.address
      const amountIn = fromAmountUI

      const response = await getTradingRoute({
        tokenIn,
        tokenOut,
        amountIn,
        networkId: ChainId.BSC,
        tradeType: 0,
      })

      const data = response?.data || response
      const outAmount = data?.outAmount || data?.quote
      const minAmountOut = subtractSlippage(slippage, outAmount) || '0'
      const priceImpact = data?.priceImpact || response?.priceImpact || 0
      const route = data?.route || response?.route || []

      const quote = {
        ...response,
        ...data,
        outAmount,
        minAmountOut,
        priceImpact,
        route,
      }

      return {
        quote,
        route: route || [],
        outAmount: toWei(outAmount, toAsset.decimals).toString(10) || '',
        minAmountOut: toWei(minAmountOut, toAsset.decimals).toString(10) || '',
        priceImpact: priceImpact || 0,
      }
    },
    refetchInterval: 10_000,
    enabled: Boolean(enabled && fromAmountUI && fromAsset && toAsset),
    retry: 2,
    refetchOnWindowFocus: false,
  })

const useSwap = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const routerContract = geUniversalRouterContract(chainId)
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const t = useTranslations()

  const onSwap = useCallback(
    async ({ fromAsset, toAsset, fromAmount, commands, inputs, deadline }, onSuccess) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const swapuuid = uuidv4()
      const routerAddress = routerContract?.address

      if (!routerAddress) {
        throw new Error('Router address not found')
      }

      if (!commands || !inputs || commands.length === 0 || inputs.length === 0) {
        throw new Error('Commands and inputs are required')
      }

      let isApproved = true
      let tokenContract = null

      if (fromAsset?.address !== 'BNB') {
        tokenContract = getERC20Contract(fromAsset.address, chainId)
        const allowance = await readCall(tokenContract, 'allowance', [account, routerAddress])
        isApproved = fromWei(allowance, fromAsset.decimals).gte(fromAmount)
      }

      startTxn({
        key,
        title: t('Swap [symbolA] for [symbolB]', { symbolA: fromAsset.symbol, symbolB: toAsset.symbol }),
        isTranslation: false,
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `${t('Approve')} ${fromAsset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [swapuuid]: {
            desc: t('Swap [symbolA] for [symbolB]', { symbolA: fromAsset.symbol, symbolB: toAsset.symbol }),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)

      try {
        if (!isApproved) {
          if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [routerAddress, maxUint256]))) {
            setPending(false)
            return false
          }
        }

        const currentTimestamp = parseInt(new Date().getTime() / 1000, 10)
        const tx = await writeTxn(
          key,
          swapuuid,
          routerContract,
          'execute',
          [commands, inputs, currentTimestamp + deadline * 60],
          fromAsset.address === 'BNB' ? toWei(fromAmount, fromAsset.decimals).toFixed(0) : '0',
        )

        if (!tx) {
          setPending(false)
          return
        }

        endTxn(key, swapuuid, tx.hash, TXN_STATUS.SUCCESS)
        setPending(false)
        closeTxnModal()
        onSuccess?.()
      } catch (error) {
        setPending(false)
        throw error
      }
    },
    [account, chainId, routerContract, startTxn, endTxn, writeTxn, closeTxnModal, t],
  )

  return { onSwap, pending }
}

const useTheFallbackCommandsInput = (fromAsset, toAsset, fromAmountUI, route) => {
  const { account, chainId } = useWallet()
  const { deadline } = useSettings()

  const routerAddress = Contracts.UniversalRouter?.[chainId] || Contracts.fusionRouter[chainId]

  return useCommandsInput({
    route: route || [],
    isNativeTokenInput: fromAsset?.symbol === 'BNB',
    tokenIn: fromAsset,
    tokenOut: toAsset,
    tradeType: TRADE_TYPE.EXACT_INPUT,
    amountIn: fromAmountUI,
    userAddress: account,
    routerAddress,
    deadline: parseInt(new Date().getTime() / 1000, 10) + deadline * 60,
    isJustWrap: false,
    isJustUnwrap: false,
  })
}

const useCompareTrade = (fromAsset, toAsset, fromAmountUI, bestTrade, tradeLH) => {
  const { slippage } = useSettings()

  const { isLoading, refetch } = useQuery({
    queryKey: ['the-fallback-compare', fromAsset?.address, toAsset?.address, fromAmountUI],
    queryFn: async () => {
      const tokenIn = fromAsset.address === 'BNB' ? Contracts.WBNB[fromAsset.chainId]?.toLowerCase() : fromAsset.address
      const tokenOut = toAsset.address === 'BNB' ? Contracts.WBNB[toAsset.chainId]?.toLowerCase() : toAsset.address
      const amountIn = toWei(fromAmountUI, fromAsset.decimals).toString()

      const response = await getTradingRoute({
        tokenIn,
        tokenOut,
        amountIn,
        networkId: ChainId.BSC,
        tradeType: 0,
      })

      const quote = {
        ...response,
        outAmount: response.outAmount || response.amountOut || response.outputAmount,
        minAmountOut: response.minAmountOut || response.minOutputAmount,
        priceImpact: response.priceImpact || 0,
        route: response.route || response.data?.route || [],
      }

      const dexMinAmountOut = subtractSlippage(slippage, bestTrade?.outAmounts[0]) || '0'
      const lhMinAmountOut = subtractSlippage(slippage, tradeLH?.outAmount) || '0'
      const theFallbackMinAmountOut = quote?.minAmountOut || '0'

      const options = [
        { source: 'odos', minAmountOut: dexMinAmountOut },
        { source: 'lh', minAmountOut: lhMinAmountOut },
        { source: 'theFallback', minAmountOut: theFallbackMinAmountOut, quote },
      ]

      const bestOption = options.reduce(
        (best, current) => (BigNumber(current.minAmountOut).gt(best.minAmountOut) ? current : best),
        options[0],
      )

      return {
        isTheFallback: bestOption.source === 'theFallback',
        quote: bestOption.quote,
        source: bestOption.source,
      }
    },
    enabled: false,
    retry: false,
  })

  const callback = useCallback(async () => {
    const result = await refetch()
    return result.data || null
  }, [refetch])

  return { callback, isLoading }
}

export const theFallback = {
  useTrade,
  useSwap,
  useCompareTrade,
  useTheFallbackCommandsInput,
  subtractSlippage,
}
