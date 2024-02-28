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
        title: `Stake ${pair.symbol}`,
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: 'Approve LP',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [stakeuuid]: {
            desc: 'Stake LP',
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
    [account, chainId, startTxn, writeTxn, endTxn],
  )

  return { onGaugeStake, pending }
}

export const useGuageUnstake = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onGaugeUnstake = useCallback(
    async (pair, amount, callback) => {
      const key = uuidv4()
      const unstakeuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: `Unstake ${pair.symbol}`,
        transactions: {
          [unstakeuuid]: {
            desc: 'Unstake LP',
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const gaugeContract = getGaugeContract(pair.gauge.address, chainId)
      const params = [toWei(amount, pair.decimals).toFixed(0)]
      if (!(await writeTxn(key, unstakeuuid, gaugeContract, 'withdraw', params))) {
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
    [chainId, startTxn, writeTxn, endTxn],
  )

  return { onGaugeUnstake, pending }
}

export const useGuageHarvset = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onGaugeHarvest = useCallback(
    async pair => {
      const key = uuidv4()
      const harvestuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: 'Harvest rewards',
        transactions: {
          [harvestuuid]: {
            desc: 'Harvest rewards',
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
    [chainId, startTxn, writeTxn, endTxn],
  )

  return { onGaugeHarvest, pending }
}

export const useGuageAllHarvset = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onGaugeAllHarvest = useCallback(
    async pairs => {
      const key = uuidv4()
      const harvestuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: 'Harvest farmed rewards',
        transactions: {
          [harvestuuid]: {
            desc: `Harvest farmed rewards (${pairs.length})`,
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
    [chainId, startTxn, writeTxn, endTxn],
  )

  return { onGaugeAllHarvest, pending }
}
