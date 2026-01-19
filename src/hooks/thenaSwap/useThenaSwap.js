/* global BigInt */
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { encodeAbiParameters, encodePacked, maxUint256, parseAbiParameters, zeroAddress } from 'viem'

import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { PROTOCOL, SWAP_COMMANDS, TRADE_TYPE } from '@/constant/thenaSwap'
import useWallet from '@/hooks/useWallet'
import { getTradingRoute } from '@/lib/api'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, geUniversalRouterContract } from '@/lib/contracts'
import { useSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'
import { fromWei, toWei, toWeiRound } from '@/utils/utils'

export const subtractSlippage = (allowedSlippage, outAmount) => {
  if (!outAmount) return undefined
  return BigNumber(outAmount)
    .multipliedBy(BigNumber(10000 - allowedSlippage * 100))
    .div(BigNumber(10000))
    .toString()
}

function packAddresses(addresses, insertZero = false) {
  const fullAddresses = []
  for (let i = 0; i < addresses.length; i++) {
    fullAddresses.push(addresses[i])
    if (insertZero && i < addresses.length - 1) {
      fullAddresses.push(zeroAddress)
    }
  }

  const abiTypes = Array(fullAddresses.length).fill('address')
  return encodePacked(abiTypes, fullAddresses)
}

const encIntegralExactInput = ({ path, recipient, deadline, amountIn, amountOutMinimum }, insertZero = false) =>
  encodeAbiParameters(
    parseAbiParameters('(bytes path,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum)'),
    [
      {
        path: packAddresses(path, insertZero),
        recipient,
        deadline: BigInt(deadline),
        amountIn,
        amountOutMinimum,
      },
    ],
  )

function encSolidlySwapParams({ amountIn, amountOutMin, routes, to, deadline }) {
  const tupleRoutes = routes.map(r => [r.from, r.to, !!r.stable])
  const paramsBytes = encodeAbiParameters(
    parseAbiParameters(
      '(uint256 amountIn,uint256 amountOutMin,(address from,address to,bool stable)[] routes,address to,uint256 deadline)',
    ),
    [
      {
        amountIn,
        amountOutMin,
        routes: tupleRoutes,
        to,
        deadline,
      },
    ],
  )

  return paramsBytes
}

const getCommands = (protocol, tradeType = TRADE_TYPE.EXACT_INPUT) => {
  if (protocol === PROTOCOL.SOLIDLY) {
    return tradeType === TRADE_TYPE.EXACT_INPUT
      ? SWAP_COMMANDS.SLD_EXACT_TOKENS_TOKENS
      : SWAP_COMMANDS.SLD_EXACT_TOKENS_TOKENS_FEE
  }

  if (protocol === PROTOCOL.FUSION) {
    return tradeType === TRADE_TYPE.EXACT_INPUT ? SWAP_COMMANDS.FUSION_EXACT_INPUT : SWAP_COMMANDS.FUSION_EXACT_OUTPUT
  }

  if (protocol === PROTOCOL.INTEGRAL) {
    return tradeType === TRADE_TYPE.EXACT_INPUT
      ? SWAP_COMMANDS.INTEGRAL_EXACT_INPUT
      : SWAP_COMMANDS.INTEGRAL_EXACT_OUTPUT
  }

  return null
}

const calculateCommandsInput = ({
  route,
  isNativeTokenInput,
  tokenIn,
  tokenOut,
  tradeType = TRADE_TYPE.EXACT_INPUT,
  amountIn,
  userAddress,
  routerAddress,
  deadline,
  slippage,
}) => {
  const amountInWei = toWeiRound(amountIn ?? '0', tokenIn?.decimals)
  const commands = []
  const inputs = []

  if (!route || route.length === 0) {
    return {
      commands: [],
      inputs: [],
    }
  }

  // 1) Transfer or wrap input
  if (isNativeTokenInput) {
    commands.push(SWAP_COMMANDS.NATIVE_TO_WRAPPED)
    inputs.push(encodeAbiParameters(parseAbiParameters('uint256, address'), [amountInWei, routerAddress]))
  } else {
    commands.push(SWAP_COMMANDS.TRANSFER_TOKEN_FROM_MSGSENDER)
    inputs.push(
      encodeAbiParameters(parseAbiParameters('address token, uint256 amount'), [tokenIn.address, amountInWei]),
    )
  }

  route.forEach(hop => {
    const isLastHop = route.indexOf(hop) === route.length - 1
    const shouldUnwrap = isLastHop && tokenOut?.symbol === 'BNB'
    const recipient = shouldUnwrap ? routerAddress : isLastHop ? userAddress : routerAddress
    const cmd = getCommands(hop.protocol, tradeType)
    const hopInputToken = hop.route?.input || hop.route?.tokenPath?.[0]
    const hopInputDecimals = hopInputToken?.decimals || tokenIn?.decimals
    const _amountIn = toWeiRound(BigNumber(amountIn).times(hop.percent).div(100).toString(), hopInputDecimals)
    // Calculate amountOutMin with slippage: amountOut * (1 - slippage / 100)
    const hopOutputDecimals = hop.quoteToken?.decimals || tokenOut?.decimals || 18
    const _amountOutMin = toWeiRound(
      BigNumber(hop.quote)
        .times(100 - slippage)
        .div(100)
        .toString(),
      hopOutputDecimals,
    )
    const routes = []

    if (hop.protocol === PROTOCOL.SOLIDLY) {
      const pairs = hop.route?.pairs || []
      const path = hop.route?.path || []
      if (pairs.length > 0 && path.length > 0) {
        for (let i = 0; i < path.length - 1; i++) {
          const from = path[i].address
          const to = path[i + 1].address
          const stable = Boolean(pairs[i]?.stable)
          routes.push({
            from,
            to,
            stable,
          })
        }
      }
      inputs.push(
        encSolidlySwapParams({
          amountIn: _amountIn,
          amountOutMin: _amountOutMin,
          routes,
          to: recipient,
          deadline,
        }),
      )
    } else {
      const path = (hop.route?.tokenPath || []).map(tk => tk.address)
      inputs.push(
        encIntegralExactInput(
          {
            path,
            recipient,
            deadline,
            amountIn: _amountIn,
            amountOutMinimum: _amountOutMin,
          },
          hop.protocol === PROTOCOL.INTEGRAL,
        ),
      )
    }
    commands.push(cmd)

    if (isLastHop && tokenOut?.symbol === 'BNB') {
      commands.push(SWAP_COMMANDS.WRAPPED_TO_NATIVE)
      inputs.push(
        encodeAbiParameters(parseAbiParameters('uint256, address'), [
          toWeiRound(
            BigNumber(hop.quote)
              .times(100 - slippage)
              .div(100)
              .toString(),
            hopOutputDecimals,
          ),
          userAddress,
        ]),
      )
    }
  })

  return { commands, inputs }
}

/**
 * @param {import('@/types/asset').Asset} fromAsset
 * @param {import('@/types/asset').Asset} toAsset
 * @param {string} fromAmountUI
 * @param {boolean} enabled
 * @param {number} slippage
 * @param {object} bestTrade - The best trade from Odos
 * @param {object} tradeLH - The trade from LiquidityHub
 * @param {boolean} liquidityHubEnabled - Whether LiquidityHub is enabled
 */
const useTrade = (fromAsset, toAsset, fromAmountUI, enabled, slippage, bestTrade, tradeLH, liquidityHubEnabled) =>
  useQuery({
    queryKey: [
      'the-fallback-trade',
      fromAsset?.address,
      toAsset?.address,
      fromAmountUI,
      liquidityHubEnabled,
      bestTrade?.outAmounts[0] || '',
      tradeLH?.outAmount || '',
    ],
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

      const outAmountInWei = toWei(outAmount, toAsset.decimals) || ''
      const theFallbackMinAmountOut = subtractSlippage(slippage, outAmountInWei) || '0'

      // Calculate isFallbackThe (is better than other options)
      let isThenaSwap = false
      if (liquidityHubEnabled && tradeLH) {
        const lhMinAmountOut = subtractSlippage(slippage, tradeLH?.outAmount) || '0'
        isThenaSwap = new BigNumber(theFallbackMinAmountOut).gt(lhMinAmountOut)
      } else if (!liquidityHubEnabled && bestTrade) {
        const dexMinAmountOut = subtractSlippage(slippage, bestTrade?.outAmounts[0]) || '0'
        isThenaSwap = new BigNumber(theFallbackMinAmountOut).gt(dexMinAmountOut)
      } else if (!tradeLH && !bestTrade && response?.data) {
        isThenaSwap = true
      }

      return {
        quote,
        route: route || [],
        outAmount: outAmountInWei,
        minAmountOut: theFallbackMinAmountOut,
        priceImpact: priceImpact || 0,
        isThenaSwap,
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
  const { deadline, slippage } = useSettings()
  const t = useTranslations()

  const onSwap = useCallback(
    async ({ fromAsset, toAsset, fromAmount, tradeThenaSwap }, onSuccess) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const swapuuid = uuidv4()
      const routerAddress = routerContract?.address

      if (!routerAddress) {
        throw new Error('Router address not found')
      }

      if (!tradeThenaSwap?.route || tradeThenaSwap.route.length === 0) {
        throw new Error('Trade route is required')
      }

      // Calculate commands and inputs on-demand when swapping
      const routerAddressForCommands = Contracts.UniversalRouter?.[chainId] || Contracts.fusionRouter[chainId]
      const currentDeadline = parseInt(new Date().getTime() / 1000, 10) + deadline * 60
      const { commands, inputs } = calculateCommandsInput({
        route: tradeThenaSwap.route,
        isNativeTokenInput: fromAsset?.symbol === 'BNB',
        tokenIn: fromAsset,
        tokenOut: toAsset,
        tradeType: TRADE_TYPE.EXACT_INPUT,
        amountIn: fromAmount,
        userAddress: account,
        routerAddress: routerAddressForCommands,
        deadline: currentDeadline,
        slippage,
      })

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

        const tx = await writeTxn(
          key,
          swapuuid,
          routerContract,
          'execute',
          [commands, inputs, currentDeadline],
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
    [account, chainId, routerContract, startTxn, endTxn, writeTxn, closeTxnModal, deadline, slippage, t],
  )

  return { onSwap, pending }
}

export const thenaSwap = {
  useTrade,
  useSwap,
  subtractSlippage,
}
