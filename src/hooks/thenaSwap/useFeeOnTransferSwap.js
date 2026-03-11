'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { PROTOCOL } from '@/constant/thenaSwap'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getRouterV2Contract } from '@/lib/contracts'
import { useSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'
import { fromWei, toWeiRound } from '@/utils/utils'

import { feeOnTransferTokens } from './feeOnTransferTokens'

const FEE_ON_TRANSFER_SET = new Set(feeOnTransferTokens.map(a => a.toLowerCase()))

export function routeHasFeeOnTransferToken(route) {
  if (!route || !Array.isArray(route)) return false
  for (const hop of route) {
    const path = hop.route?.tokenPath || hop.route?.path || []
    for (const token of path) {
      const addr = typeof token === 'string' ? token : token?.address
      if (addr && FEE_ON_TRANSFER_SET.has(addr.toLowerCase())) return true
    }
  }
  return false
}

/** Build Solidly-style routes array [{ from, to, stable }, ...] from a V1 hop */
function getHopSolidlyRoutes(hop) {
  const pairs = hop.route?.pairs || []
  const path = hop.route?.path || hop.route?.tokenPath || []
  if (pairs.length === 0 || path.length < 2) return []
  const routes = []
  for (let i = 0; i < path.length - 1; i++) {
    const from = typeof path[i] === 'string' ? path[i] : path[i]?.address
    const to = typeof path[i + 1] === 'string' ? path[i + 1] : path[i + 1]?.address
    if (from && to) routes.push({ from, to, stable: Boolean(pairs[i]?.stable) })
  }
  return routes
}

export function useFeeOnTransferSwap() {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { deadline } = useSettings()
  const t = useTranslations()

  const onSwap = useCallback(
    async ({ fromAsset, toAsset, fromAmount, tradeThenaSwap }, onSuccess) => {
      if (!routeHasFeeOnTransferToken(tradeThenaSwap?.route)) {
        throw new Error('Fee-on-transfer swap only supports routes that contain a fee-on-transfer token')
      }

      const key = uuidv4()
      const approveuuid = uuidv4()
      const swapuuid = uuidv4()
      const currentDeadline = parseInt(new Date().getTime() / 1000, 10) + deadline * 60

      const feeOnTransferRouter = getRouterV2Contract(chainId)
      const feeRouterAddress = feeOnTransferRouter?.address
      if (!feeRouterAddress) throw new Error('Fee-on-transfer router not found')
      if (!tradeThenaSwap?.route?.length) throw new Error('Trade route is required')

      const v1Hops = tradeThenaSwap.route.filter(h => h.protocol === PROTOCOL.SOLIDLY)
      if (v1Hops.length === 0) throw new Error('No V1 route for fee-on-transfer swap')

      const isNativeIn = fromAsset?.symbol === 'BNB'

      let isApproved = true
      let tokenContract = null
      if (!isNativeIn) {
        tokenContract = getERC20Contract(fromAsset.address, chainId)
        const allowance = await readCall(tokenContract, 'allowance', [account, feeRouterAddress])
        isApproved = fromWei(allowance, fromAsset.decimals).gte(fromAmount)
      }

      startTxn({
        key,
        title: t('Swap [symbolA] for [symbolB]', { symbolA: fromAsset.symbol, symbolB: toAsset.symbol }),
        isTranslation: false,
        transactions: {
          ...(!isApproved && {
            [approveuuid]: { desc: `${t('Approve')} ${fromAsset.symbol}`, status: TXN_STATUS.START, hash: null },
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
        if (!isApproved && tokenContract) {
          if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [feeRouterAddress, maxUint256]))) {
            setPending(false)
            return false
          }
        }

        for (const hop of v1Hops) {
          const routes = getHopSolidlyRoutes(hop).map(({ from, to, stable }) => ({
            from: String(from),
            to: String(to),
            stable: Boolean(stable),
          }))

          if (routes.length) {
            const hopInputToken = hop.route?.input || hop.route?.tokenPath?.[0]
            const hopInputDecimals = hopInputToken?.decimals || fromAsset?.decimals || 18

            const hopAmountIn = toWeiRound(
              BigNumber(fromAmount || '0')
                .times(hop.percent || 0)
                .div(100)
                .toString(),
              hopInputDecimals,
            )

            const hopOutputDecimals = hop.quoteToken?.decimals || toAsset?.decimals || 18
            const hopAmountOutMin = toWeiRound(
              BigNumber(hop.quote || '0')
                .times(85)
                .div(100)
                .toString(),
              hopOutputDecimals,
            )

            await writeTxn(
              key,
              swapuuid,
              feeOnTransferRouter,
              'swapExactTokensForTokensSupportingFeeOnTransferTokens',
              [hopAmountIn, hopAmountOutMin, routes, account, currentDeadline],
            )
          }
        }
        endTxn({
          key,
          final: t('Swap [symbolA] for [symbolB]', { symbolA: fromAsset.symbol, symbolB: toAsset.symbol }),
        })
        setPending(false)
        closeTxnModal()
        onSuccess?.()
      } catch (error) {
        setPending(false)
        throw error
      }
    },
    [deadline, chainId, startTxn, t, account, endTxn, closeTxnModal, writeTxn],
  )

  return { onSwap, pending }
}
