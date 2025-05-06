import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { encodeFunctionData } from 'viem'

import { TXN_STATUS } from '@/constant'
import { callMulti } from '@/lib/contractActions'
import {
  getClaimerContract,
  getFarmingCenterContract,
  getGammaHyperVisorContract,
  getIchiVaultContract,
  getMultiFeeDistributionContract,
  getPairContract,
  getPositionManagerContract,
} from '@/lib/contracts'
import { NonfungiblePositionManager } from '@/lib/fusion/entities/nonfungiblePositionManager'
import { useFarmRewards } from '@/state/farmReward/store'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from './useWallet'

export const useRewardPosition = () => {
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const { chainId } = useWallet()
  const { rewards, fees } = useFarmRewards()
  const { startTxn, endTxn, writeTxn, sendTxn } = useTxn()

  const onClaimAllRewardPosition = useCallback(async () => {
    const key = uuidv4()
    const harvestNewGaugeId = uuidv4()
    const claimFarmId = uuidv4()

    const { newGauge, manual, gamma, ichi } = rewards
    const { classic: classicFees, stable: stableFees, manual: manualFees } = fees

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
          desc: `${t('Harvest Rewards')} ${_pair.symbol} Ichi pools`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (classicFees.size > 0) {
      classicFees.forEach(_pair => {
        transactions[`classic-fees-${_pair.args}`] = {
          desc: `${t('Claim Fees')} ${_pair.symbol} Classic pool`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (stableFees.size > 0) {
      stableFees.forEach(_pair => {
        transactions[`stable-fees-${_pair.args}`] = {
          desc: `${t('Claim Fees')} ${_pair.symbol} Stable pool`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (manualFees.size > 0) {
      manualFees.forEach(_pair => {
        transactions[`manual-fees-${_pair.args}`] = {
          desc: `${t('Claim Fees')} ${_pair.symbol} Manual pools #${_pair.args[1]}`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    setPending(true)
    startTxn({ key, title: 'Claim All Rewards', transactions })

    if (newGauge.size > 0) {
      const params = []
      newGauge.forEach(pair => params.push(pair.args))
      const claimer = getClaimerContract(chainId)
      if (!(await writeTxn(key, harvestNewGaugeId, claimer, 'claimRewards', [params]))) {
        setPending(false)
        return
      }
    }

    if (manual.size > 0) {
      const farmingCenter = getFarmingCenterContract(chainId)
      const calldata = []
      manual.forEach(pair => {
        calldata.push(
          encodeFunctionData({
            abi: farmingCenter.abi,
            functionName: 'collectAndClaimRewards',
            args: pair.args,
          }),
        )
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

    if (classicFees.size > 0) {
      const poolAddresses = []
      classicFees.forEach(pair => poolAddresses.push(pair.args))

      for (let i = 0; i < poolAddresses.length; i++) {
        const pairAddress = poolAddresses[i]
        const pairContract = getPairContract(pairAddress, chainId)
        if (!(await writeTxn(key, `classic-fees-${pairAddress}`, pairContract, 'claimFees', []))) {
          setPending(false)
          return
        }
      }
    }

    if (stableFees.size > 0) {
      const poolAddresses = []
      stableFees.forEach(pair => poolAddresses.push(pair.args))

      for (let i = 0; i < poolAddresses.length; i++) {
        const pairAddress = poolAddresses[i]
        const pairContract = getPairContract(pairAddress, chainId)
        if (!(await writeTxn(key, `stable-fees-${pairAddress}`, pairContract, 'claimFees', []))) {
          setPending(false)
          return
        }
      }
    }

    if (manualFees.size > 0) {
      const manualFeesArr = [...manualFees]
      for (let i = 0; i < manualFeesArr.length; i++) {
        const pair = manualFeesArr[i][1]

        const [feeValue0, feeValue1] = pair.amount
        const [account, tokenId, version] = pair.args
        const positionManger = getPositionManagerContract(chainId, version)
        const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
          tokenId,
          expectedCurrencyOwed0: feeValue0,
          expectedCurrencyOwed1: feeValue1,
          recipient: account,
        })

        if (!(await sendTxn(key, `manual-fees-${pair.args}`, positionManger.address, calldata, value))) {
          setPending(false)
          return
        }
      }
    }

    endTxn({ key, final: 'Claim Successful' })
    setPending(false)
  }, [rewards, fees, startTxn, endTxn, t, chainId, writeTxn, sendTxn])

  return { onClaimAllRewardPosition, pending }
}
