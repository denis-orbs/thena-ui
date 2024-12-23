import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { PAIR_TYPES, TXN_STATUS } from '@/constant'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getBribeContract, getERC20Contract, getGlobalFactoryContract } from '@/lib/contracts'
import { warnToast } from '@/lib/notify'
import { fromWei, toWei } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

export const POOL_TYPES = {
  Classic: 0,
  Stable: 0,
  'Conc Liquidity': 1,
  Weighted: 3,
}

export const useGaugeAdd = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onGaugeAdd = useCallback(
    async (pool, callback) => {
      if (!pool) {
        warnToast('Select Pair')
        return
      }
      const globalFactoryContract = getGlobalFactoryContract(chainId)

      let res = []
      if (pool.type === PAIR_TYPES.WEIGHTED) {
        res = await Promise.all(
          pool.tokens.map(token => readCall(globalFactoryContract, 'isToken', [token.address], chainId)),
        )
      } else {
        res = await Promise.all([
          readCall(globalFactoryContract, 'isToken', [pool.token0.address], chainId),
          readCall(globalFactoryContract, 'isToken', [pool.token1.address], chainId),
        ])
      }

      const isWhitelisted = res.every(ele => ele)
      if (!isWhitelisted) {
        warnToast('Tokens are not whitelisted')
        return
      }
      const key = uuidv4()
      const adduuid = uuidv4()
      startTxn({
        key,
        title: t('Add Gauge'),
        transactions: {
          [adduuid]: {
            desc: t('Add Gauge'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)
      const params = [pool.address, POOL_TYPES[pool.type]]
      if (!(await writeTxn(key, adduuid, globalFactoryContract, 'create', params))) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Gauge Add Successful' })
      callback()
      setPending(false)
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onGaugeAdd, pending }
}

export const useBribeAdd = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onBribeAdd = useCallback(
    async (pool, asset, amount, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const bribeuuid = uuidv4()
      const bribeAddress = pool.gauge.bribe
      const tokenContract = getERC20Contract(asset.address, chainId)
      const allowance = await readCall(tokenContract, 'allowance', [account, bribeAddress], chainId)
      const isApproved = fromWei(allowance).gte(amount)
      setPending(true)
      startTxn({
        key,
        title: t('Add Incentive'),
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `${t('Approve')} ${asset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [bribeuuid]: {
            desc: t('Add Incentive'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      if (!isApproved) {
        if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [bribeAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const bribeContract = getBribeContract(bribeAddress, chainId)
      const sendAmount = toWei(amount, asset.decimals).toFixed(0)
      const params = [asset.address, sendAmount]
      if (!(await writeTxn(key, bribeuuid, bribeContract, 'notifyRewardAmount', params))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Bribe Add Successful',
      })
      callback()
      setPending(false)
    },
    [account, chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onBribeAdd, pending }
}
