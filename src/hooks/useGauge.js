import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getGaugeContract, getVoterContract } from '@/lib/contracts'
import { fromWei, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useGuageStake = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onGaugeStake = useCallback(
    async (pair, amount, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const stakeuuid = uuidv4()
      const lpContract = getERC20Contract(pair.address, chainId)

      setPending(true)

      const allowance = await readCall(lpContract, 'allowance', [account, pair.gauge.address])
      const isApproved = fromWei(allowance).gte(amount)

      startTxn({
        key,
        desc: `${t('Stake')} LP`,
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `${t('Approve')} LP`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [stakeuuid]: {
            desc: `${t('Stake')} ${pair.symbol} LP`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      if (!isApproved) {
        if (!(await writeTxn(key, approveuuid, lpContract, 'approve', [pair.gauge.address, maxUint256]))) {
          setPending(false)
          return
        }
      }
      const gaugeContract = getGaugeContract(pair.gauge.address, chainId)
      const params = [toWei(amount, pair.decimals).toFixed(0)]
      if (!(await writeTxn(key, stakeuuid, gaugeContract, 'deposit', params))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Stake Successful',
      })
      setPending(false)
      callback()
    },
    [account, chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onGaugeStake, pending }
}

export const useGuageUnstake = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onGaugeUnstake = useCallback(
    async (pair, amount, callback) => {
      const key = uuidv4()
      const unstakeuuid = uuidv4()
      const shouldHarvest = pair.account.earnedUsd.gt(0) && pair.account.gaugeBalance.eq(amount)

      setPending(true)

      startTxn({
        key,
        title: shouldHarvest ? t('Unstake and Harvest') : `${t('Unstake')} LP`,
        transactions: {
          [unstakeuuid]: {
            desc: shouldHarvest ? t('Unstake and Harvest') : `${t('Unstake')} LP`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const gaugeContract = getGaugeContract(pair.gauge.address, chainId)
      const params = shouldHarvest ? [] : [toWei(amount, pair.decimals).toFixed(0)]
      const func = shouldHarvest ? 'withdrawAllAndHarvest' : 'withdraw'
      if (!(await writeTxn(key, unstakeuuid, gaugeContract, func, params))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Unstake Successful',
      })
      setPending(false)
      callback()
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onGaugeUnstake, pending }
}

export const useGuageHarvset = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onGaugeHarvest = useCallback(
    async pair => {
      const key = uuidv4()
      const harvestuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: t('Harvest Rewards'),
        transactions: {
          [harvestuuid]: {
            desc: t('Harvest Rewards'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const gaugeContract = getGaugeContract(pair.gauge.address, chainId)
      if (!(await writeTxn(key, harvestuuid, gaugeContract, 'getReward', []))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Harvest Successful',
      })
      setPending(false)
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onGaugeHarvest, pending }
}

export const useGuageAllHarvset = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onGaugeAllHarvest = useCallback(
    async pairs => {
      const key = uuidv4()
      const harvestuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: t('Harvest Rewards'),
        transactions: {
          [harvestuuid]: {
            desc: `${t('Harvest Rewards')} (${pairs.length})`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const params = pairs.map(pair => pair.gauge.address)
      const voterContract = getVoterContract(chainId)
      if (!(await writeTxn(key, harvestuuid, voterContract, 'claimRewards', [params]))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Harvest Successful',
      })
      setPending(false)
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onGaugeAllHarvest, pending }
}
