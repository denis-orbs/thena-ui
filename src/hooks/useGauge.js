import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { encodeFunctionData, maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import useWallet from '@/hooks/useWallet'
import { callMulti, readCall } from '@/lib/contractActions'
import {
  getClaimerContract,
  getERC20Contract,
  getFarmingCenterContract,
  getGammaHyperVisorContract,
  getGaugeContract,
  getIchiVaultContract,
  getMultiFeeDistributionContract,
} from '@/lib/contracts'
import { fromWei, toWei } from '@/lib/utils'
import { useFarmRewards } from '@/state/farmReward/store'
import { useTxn } from '@/state/transactions/hooks'

import { collectAndClaimRewards } from './fusion/useAlgebra'

export const useGaugeStake = () => {
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

      const allowance = await readCall(lpContract, 'allowance', [account, pair.gauge.address], chainId)
      const isApproved = fromWei(allowance).gte(amount)

      startTxn({
        key,
        title: 'Stake',
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

export const useGaugeUnstake = () => {
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

export const useGaugeHarvest = () => {
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
        title: 'Harvest Rewards',
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

export const useGaugeAllHarvest = () => {
  const t = useTranslations()
  const { rewards } = useFarmRewards()

  const { chainId, account } = useWallet()
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn, sendTxn } = useTxn()

  const onGaugeAllHarvest = useCallback(async () => {
    const key = uuidv4()
    const harvestNewGaugeId = uuidv4()
    const claimFarmId = uuidv4()

    const { newGauge, manual, gamma, ichi, ichiSingleSided } = rewards

    const transactions = {}
    if (newGauge.size > 0) {
      transactions[harvestNewGaugeId] = {
        desc: `${t('Harvest Rewards')} Classics/Stable/Weighted pools`,
        status: TXN_STATUS.START,
        hash: null,
      }
    }

    if (manual.size > 0) {
      transactions[claimFarmId] = {
        desc: `${t('Harvest Rewards')} Manual pools`,
        status: TXN_STATUS.START,
        hash: null,
      }
    }

    if (gamma.size > 0) {
      gamma.forEach(_pair => {
        transactions[`gamma-${_pair.args}`] = {
          desc: `${t('Harvest Rewards')} ${_pair.symbol} Gamma pools`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (ichi.size > 0) {
      ichi.forEach(_pair => {
        transactions[`ichi-${_pair.args}`] = {
          desc: `${t('Harvest Rewards')} ${_pair.symbol} Ichi pool`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (ichiSingleSided.size > 0) {
      ichiSingleSided.forEach(_pair => {
        transactions[`ichi-v2-${_pair.args}`] = {
          desc: `${t('Harvest Rewards')} ${_pair.symbol} Single Sided Vault`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    setPending(true)
    startTxn({ key, title: 'Harvest Farmed Rewards', transactions })

    if (newGauge.size > 0) {
      const params = []
      newGauge.forEach(pair => params.push(pair.args))
      const claimer = getClaimerContract(chainId)
      if (!(await writeTxn(key, harvestNewGaugeId, claimer, 'claimRewards', [params]))) {
        setPending(false)
        return
      }
    }

    // manual = Map<[key, {amount: number, args: [account, poolKey, tokenId]}]>
    if (manual.size > 0) {
      const farmingCenter = getFarmingCenterContract(chainId)
      const calldata = collectAndClaimRewards({
        positions: Array.from(manual).map(pair => ({
          poolKey: pair[1].args[1],
          tokenId: pair[1].args[2],
        })),
        chainId,
        account,
      })
      const encoded = encodeFunctionData({
        abi: farmingCenter.abi,
        functionName: 'multicall',
        args: [calldata],
      })

      if (!(await sendTxn(key, claimFarmId, farmingCenter.address, encoded))) {
        setPending(false)
        return
      }
    }

    if (gamma.size > 0) {
      const poolAddresses = []
      gamma.forEach(pair => poolAddresses.push(pair.args))

      const receivers = await callMulti(
        poolAddresses.map(add => ({
          ...getGammaHyperVisorContract(add, chainId, 3),
          functionName: 'receiver',
        })),
      )

      // const txs = await callMultiWithLog(
      //   receivers.map(add => ({
      //     ...getMultiFeeDistributionContract(add, chainId),
      //     functionName: 'getAllRewards',
      //   })),
      // )

      for (let i = 0; i < receivers.length; i++) {
        const receiver = receivers[i]
        const poolAddress = poolAddresses[i]
        const multiFeeDistributionContract = getMultiFeeDistributionContract(receiver, chainId)
        const tx = await writeTxn(key, `gamma-${poolAddress}`, multiFeeDistributionContract, 'getAllRewards', [])
        if (!tx) {
          setPending(false)
          return
        }
      }
    }

    if (ichi.size > 0) {
      const poolAddresses = []
      ichi.forEach(pair => poolAddresses.push(pair.args))

      const receivers = await callMulti(
        poolAddresses.map(add => ({
          ...getIchiVaultContract(add, chainId, 3),
          functionName: 'farmingContract',
        })),
      )

      for (let i = 0; i < receivers.length; i++) {
        const receiver = receivers[i]
        const poolAddress = poolAddresses[i]
        const multiFeeDistributionContract = getMultiFeeDistributionContract(receiver, chainId)
        const tx = await writeTxn(key, `ichi-${poolAddress}`, multiFeeDistributionContract, 'getAllRewards', [])
        if (!tx) {
          setPending(false)
          return
        }
      }
    }

    if (ichiSingleSided.size > 0) {
      const gaugeAddresses = []
      ichiSingleSided.forEach(pair => gaugeAddresses.push(pair.args))

      for (let i = 0; i < gaugeAddresses.length; i++) {
        const gaugeAddress = gaugeAddresses[i]
        const gaugeContract = getGaugeContract(gaugeAddress, chainId)
        if (!(await writeTxn(key, `ichi-v2-${gaugeAddresses}`, gaugeContract, 'getReward', []))) {
          setPending(false)
          return
        }
      }
    }

    endTxn({ key, final: 'Harvest Successful' })
    setPending(false)
  }, [rewards, startTxn, endTxn, t, chainId, writeTxn, account, sendTxn])

  return { onGaugeAllHarvest, pending }
}
