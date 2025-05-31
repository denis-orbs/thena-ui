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
  getGaugeContract,
  getIchiVaultContract,
  getMultiFeeDistributionContract,
  getPairContract,
  getPositionManagerContract,
} from '@/lib/contracts'
import { NonfungiblePositionManager } from '@/lib/fusion/entities/nonfungiblePositionManager'
import { useFarmRewards } from '@/state/farmReward/store'
import { useTxn } from '@/state/transactions/hooks'

import { collectAndClaimRewards } from './fusion/useAlgebra'
import useWallet from './useWallet'

export const useRewardPosition = () => {
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const { chainId, account: userAddress } = useWallet()
  const { rewards, fees } = useFarmRewards()
  const { startTxn, endTxn, writeTxn, sendTxn } = useTxn()

  const onClaimAllRewardPosition = useCallback(async () => {
    const key = uuidv4()
    const harvestNewGaugeId = uuidv4()
    const claimFarmId = uuidv4()
    const claimFeesV2Id = uuidv4()
    const claimFeesV3Id = uuidv4()

    const { newGauge, manual, gamma, ichi, ichiSingleSided } = rewards
    const { classic: classicFees, stable: stableFees, manualV2: manualFeesV2, manualV3: manualFeesV3 } = fees

    const transactions = {}
    if (newGauge.size > 0) {
      transactions[harvestNewGaugeId] = {
        desc: `${t('Harvest Rewards')} Classics/Stable/Weighted Pools`,
        status: TXN_STATUS.START,
        hash: null,
      }
    }

    if (manual.size > 0) {
      transactions[claimFarmId] = {
        desc: `${t('Harvest Rewards')} Manual Pools`,
        status: TXN_STATUS.START,
        hash: null,
      }
    }

    if (gamma.size > 0) {
      gamma.forEach(_pair => {
        transactions[`gamma-${_pair.args}`] = {
          desc: `${t('Harvest Rewards')} ${_pair.symbol} Gamma Pool`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (ichi.size > 0) {
      ichi.forEach(_pair => {
        transactions[`ichi-${_pair.args}`] = {
          desc: `${t('Harvest Rewards')} ${_pair.symbol} Ichi Pool`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (ichiSingleSided.size > 0) {
      ichiSingleSided.forEach(_pair => {
        transactions[`ichi-single-sided-${_pair.args}`] = {
          desc: `${t('Harvest Rewards')} ${_pair.symbol} Single Sided Vault`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (classicFees.size > 0) {
      classicFees.forEach(_pair => {
        transactions[`classic-fees-${_pair.args}`] = {
          desc: `${t('Claim Fees')} ${_pair.symbol} Classic Pool`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (stableFees.size > 0) {
      stableFees.forEach(_pair => {
        transactions[`stable-fees-${_pair.args}`] = {
          desc: `${t('Claim Fees')} ${_pair.symbol} Stable Pool`,
          status: TXN_STATUS.START,
          hash: null,
        }
      })
    }

    if (manualFeesV2.size > 0) {
      const pairsString = [...manualFeesV2].map(_pair => `${_pair[1].symbol}#${_pair[1].args[1]}`).join(', ')
      transactions[claimFeesV2Id] = {
        desc: `${t('Claim Fees')} Manual Pools V2 (${pairsString})`,
        status: TXN_STATUS.START,
        hash: null,
      }
    }

    if (manualFeesV3.size > 0) {
      const pairsString = [...manualFeesV3].map(_pair => `${_pair[1].symbol}#${_pair[1].args[1]}`).join(', ')
      transactions[claimFeesV3Id] = {
        desc: `${t('Claim Fees')} Manual Pools V3 (${pairsString})`,
        status: TXN_STATUS.START,
        hash: null,
      }
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

    // manual = Map<[key, {amount: number, args: [account, poolKey, tokenId]}]>
    if (manual.size > 0) {
      const farmingCenter = getFarmingCenterContract(chainId)
      const calldata = collectAndClaimRewards({
        positions: Array.from(manual).map(pair => ({
          poolKey: pair[1].args[1],
          tokenId: pair[1].args[2],
        })),
        chainId,
        account: userAddress,
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

    if (ichiSingleSided.size > 0) {
      const gaugeAddresses = []
      ichiSingleSided.forEach(pair => gaugeAddresses.push(pair.args))

      for (let i = 0; i < gaugeAddresses.length; i++) {
        const gaugeAddress = gaugeAddresses[i]
        const gaugeContract = getGaugeContract(gaugeAddress, chainId)
        if (!(await writeTxn(key, `ichi-single-sided-${gaugeAddresses}`, gaugeContract, 'getReward', []))) {
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

    if (manualFeesV2.size > 0) {
      const manualFeesArr = [...manualFeesV2]
      const callDatas = []
      const positionManger = getPositionManagerContract(chainId, 2)

      for (let i = 0; i < manualFeesArr.length; i++) {
        const pair = manualFeesArr[i][1]

        const [feeValue0, feeValue1] = pair.amount
        const [account, tokenId] = pair.args
        const { calldata } = NonfungiblePositionManager.collectCallParameters({
          tokenId,
          expectedCurrencyOwed0: feeValue0,
          expectedCurrencyOwed1: feeValue1,
          recipient: account,
        })

        callDatas.push(calldata)
      }

      const encoded = encodeFunctionData({
        abi: positionManger.abi,
        functionName: 'multicall',
        args: [callDatas],
      })

      if (!(await sendTxn(key, claimFeesV2Id, positionManger.address, encoded))) {
        setPending(false)
        return
      }
    }

    if (manualFeesV3.size > 0) {
      const manualFeesArr = [...manualFeesV3]
      const callDatas = []
      const positionManger = getPositionManagerContract(chainId, 3)

      for (let i = 0; i < manualFeesArr.length; i++) {
        const pair = manualFeesArr[i][1]

        const [feeValue0, feeValue1] = pair.amount
        const [account, tokenId] = pair.args
        const { calldata } = NonfungiblePositionManager.collectCallParameters({
          tokenId,
          expectedCurrencyOwed0: feeValue0,
          expectedCurrencyOwed1: feeValue1,
          recipient: account,
        })

        callDatas.push(calldata)
      }

      const encoded = encodeFunctionData({
        abi: positionManger.abi,
        functionName: 'multicall',
        args: [callDatas],
      })

      if (!(await sendTxn(key, claimFeesV3Id, positionManger.address, encoded))) {
        setPending(false)
        return
      }
    }

    endTxn({ key, final: 'Claim Successful' })
    setPending(false)
  }, [rewards, fees, startTxn, endTxn, t, chainId, writeTxn, userAddress, sendTxn])

  return { onClaimAllRewardPosition, pending }
}
