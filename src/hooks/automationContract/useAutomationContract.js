import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256, zeroAddress } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'

import { AUTOMATION_STATUS, TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { readCall } from '@/lib/contractActions'
import { getTheContract, getVeTheAutomationContract, getVeTheAutomationFactoryContract } from '@/lib/contracts'
import { convertBooleansToHex, convertHexToBooleans, toWei } from '@/lib/utils'
import { usePoolsWithGauge } from '@/state/pools/hooks'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from '../useWallet'

export const useCreateAutomation = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onCreateAutomation = useCallback(
    async (contract, linkAmount) => {
      const key = uuidv4()
      const createAutouuid = uuidv4()
      const upkeepuuid = uuidv4()
      const approveuuid = uuidv4()
      const approveLinkuuid = uuidv4()
      const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)
      const { settings, votes } = contract

      const { pairs } = votes

      const tokenId = contract.veTHEId
      const startTimestamp = settings.executionTime
      const operations = convertBooleansToHex(votes.isAutoVote, settings.isClaimEveryWeek, settings.isRelockEveryWeek)
      const pools = pairs.map(pair => pair.pair.address)
      const weights = pairs.map(pair => pair.weight)

      const theContract = getTheContract(chainId)
      // const veTHEaddress = Contracts.veTHE[chainId]
      setPending(true)

      startTxn({
        key,
        title: 'Create Automation Contract',
        transactions: {
          [createAutouuid]: {
            desc: t('Create'),
            status: TXN_STATUS.START,
            hash: null,
          },
          [approveLinkuuid]: {
            desc: t('Approve Link Token'),
            status: TXN_STATUS.START,
            hash: null,
          },
          [upkeepuuid]: {
            desc: t('Upkeep through Chainlink Registrar'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      try {
        if (
          !(await writeTxn(key, createAutouuid, veTheAutomationFactoryContract, 'createAutomation', [
            tokenId,
            Math.floor(startTimestamp / 1000),
            operations,
            pools,
            weights,
          ]))
        ) {
          setPending(false)
          return false
        }

        const { data: automationAddress } = await readCall(
          veTheAutomationFactoryContract,
          'tokenIdToAutomation',
          [tokenId],
          chainId,
        )

        const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)

        if (
          !(await writeTxn(key, approveuuid, theContract, 'approve', [
            Contracts.transparentUpgradeableProxy[chainId],
            maxUint256,
          ]))
        ) {
          setPending(false)
          return
        }
        if (
          !(await writeTxn(key, createAutouuid, veTheAutomationContract, 'registerUpkeep', [
            Contracts.linkToken[chainId],
            toWei(linkAmount),
          ]))
        ) {
          setPending(false)
          return false
        }

        const isSuccess = await writeTxn(key, approveuuid, theContract, 'approve', [automationAddress, maxUint256])
        if (!isSuccess) {
          setPending(false)
          return
        }
        endTxn({
          key,
          final: 'Create Automation Contract Successful',
        })

        return true
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, endTxn, startTxn, t, writeTxn],
  )

  return { onCreateAutomation, pending }
}

export const getStatusString = status => {
  switch (status) {
    case 0:
      return AUTOMATION_STATUS.PENDING
    case 1:
      return AUTOMATION_STATUS.ACTIVE
    case 2:
      return AUTOMATION_STATUS.PAUSED
    case 3:
      return AUTOMATION_STATUS.CANCELED
    default:
      return 'unknown'
  }
}

export const useAutomationAddress = tokenId => {
  const { chainId } = useWallet()
  const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)
  const { data: automationAddress } = useReadContract({
    ...veTheAutomationFactoryContract,
    functionName: 'tokenIdToAutomation',
    args: [tokenId],
    enabled: Boolean(tokenId) && Boolean(chainId),
  })

  return automationAddress
}

export const useAutomationStatus = vetTHEId => {
  const { chainId } = useWallet()
  const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)
  const {
    data: automationAddress,
    refetch: mutateData1,
    isLoading: isLoading1,
  } = useReadContract({
    ...veTheAutomationFactoryContract,
    functionName: 'tokenIdToAutomation',
    args: [vetTHEId],
    enabled: Boolean(vetTHEId) && Boolean(chainId),
  })

  const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)

  const {
    data: status,
    isLoading: isLoading2,
    refetch: mutateData2,
  } = useReadContract({
    ...veTheAutomationContract,
    functionName: 'status',
    enabled: Boolean(vetTHEId) && Boolean(automationAddress) && automationAddress !== zeroAddress && Boolean(chainId),
  })

  const statusString = useMemo(() => getStatusString(status), [status])

  if (automationAddress === zeroAddress) {
    return { status: AUTOMATION_STATUS.NO, isLoading: isLoading1, mutateData: mutateData1 }
  }

  return { status: statusString, isLoading: isLoading2, mutateData: mutateData2 }
}

export const useAutomationContractDetail = tokenId => {
  const { chainId } = useWallet()
  const pools = usePoolsWithGauge()

  const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)

  const { data: automationAddress } = useReadContract({
    ...veTheAutomationFactoryContract,
    functionName: 'tokenIdToAutomation',
    args: [tokenId],
    enabled: Boolean(tokenId) && Boolean(chainId),
  })

  const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)

  const {
    data: contractInfo,
    isLoading,
    refetch: mutateData,
  } = useReadContracts({
    contracts: [
      { ...veTheAutomationContract, functionName: 'getBalance' },
      { ...veTheAutomationContract, functionName: 'getPoolsAndWeights' },
      { ...veTheAutomationContract, functionName: 'operations' },
      { ...veTheAutomationContract, functionName: 'runTimestamp' },
      { ...veTheAutomationContract, functionName: 'status' },
      { ...veTheAutomationContract, functionName: 'upkeepGasLimit' },
      { ...veTheAutomationContract, functionName: 'forwarder' },
    ],
    query: {
      enabled: Boolean(tokenId),
    },
  })

  const balance = contractInfo?.[0]?.result

  const [poolsAddress = [], weights = []] = contractInfo?.[1]?.result || [[], []]

  const operations = contractInfo?.[2]?.result
  const [isAutoVote, isClaimEveryWeek, isRelockEveryWeek] = convertHexToBooleans(operations) || [[], [], []]
  const { result: runTimestamp } = contractInfo?.[3] || {}
  const { result: status } = contractInfo?.[4] || {}
  const gasLimit = contractInfo?.[5]?.result || 0
  const forwarder = contractInfo?.[6]?.result || null

  const pairs = poolsAddress.map((address, index) => {
    const result = pools.find(pool => pool.address.toLowerCase() === address.toLowerCase())
    return result
      ? {
          pair: result,
          weight: Number(weights[index]),
          lock: true,
        }
      : {
          pair: undefined,
          weight: Number(weights[index]),
          lock: true,
        }
  })

  const statusString = useMemo(() => getStatusString(status), [status])

  const contractData = {
    address: automationAddress,
    veTHEId: tokenId,
    contractName: `veTHE Automation - ID ${tokenId}`,
    settings: {
      isClaimEveryWeek,
      isRelockEveryWeek,
      executionTime: Number(runTimestamp) * 1000,
    },
    votes: {
      isAutoVote,
      pairs,
    },
    status: statusString,
    balance: balance?.toString() || '0',
    gasLimit,
    forwarder,
  }

  const mutateAutomationData = useCallback(() => {
    mutateData()
  }, [mutateData])

  return { contractData, mutateAutomationData, isLoading }
}

const ACTION_PAUSE_TYPE = {
  PAUSE: 'pause',
  UNPAUSE: 'unpause',
}

export const usePauseAutomation = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()

  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onPauseAutomation = useCallback(
    async (automationAddress, type, onSuccess) => {
      const key = uuidv4()
      const pauseuuid = uuidv4()
      const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)

      startTxn({
        key,
        title: `${type === ACTION_PAUSE_TYPE.PAUSE ? 'Pause' : 'Unpause'} Automation Contract`,
        transactions: {
          [pauseuuid]: {
            desc: t(type === ACTION_PAUSE_TYPE.PAUSE ? 'Pause' : 'Unpause'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      try {
        setPending(true)
        if (
          !(await writeTxn(
            key,
            pauseuuid,
            veTheAutomationContract,
            type === ACTION_PAUSE_TYPE.PAUSE ? 'pause' : 'unpause',
            [],
          ))
        ) {
          setPending(false)
          return false
        }

        endTxn({
          key,
          final: `${type === ACTION_PAUSE_TYPE.PAUSE ? 'Pause' : 'Unpause'} Automation Contract Successful`,
        })

        onSuccess()
        return true
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, endTxn, startTxn, t, writeTxn],
  )

  return { onPauseAutomation, pending }
}

export const useCancelAutomation = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()

  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onCancelAutomation = useCallback(
    async (automationAddress, onSuccess) => {
      const key = uuidv4()
      const canceluuid = uuidv4()
      const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)

      startTxn({
        key,
        title: 'Cancel Automation Contract',
        transactions: {
          [canceluuid]: {
            desc: t('Cancel'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      try {
        setPending(true)
        if (!(await writeTxn(key, canceluuid, veTheAutomationContract, 'cancel', []))) {
          setPending(false)
          return false
        }

        endTxn({
          key,
          final: 'Cancel Automation Contract Successful',
        })

        onSuccess()
        return true
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, endTxn, startTxn, t, writeTxn],
  )

  return { onCancelAutomation, pending }
}

export const useEditAutomation = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()

  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onEditAutomation = useCallback(
    async (contract, onSuccess) => {
      const key = uuidv4()
      const operationsuuid = uuidv4()
      const poolWeightuuid = uuidv4()
      const veTheAutomationContract = getVeTheAutomationContract(contract.address, chainId)

      const { settings, votes } = contract

      const { pairs } = votes

      const operations = convertBooleansToHex(votes.isAutoVote, settings.isClaimEveryWeek, settings.isRelockEveryWeek)
      const pools = pairs.map(pair => pair.pair.address)
      const weights = pairs.map(pair => pair.weight)

      startTxn({
        key,
        title: 'Edit Automation Contract',
        transactions: {
          [operationsuuid]: {
            desc: t('Set Operations Contract'),
            status: TXN_STATUS.START,
            hash: null,
          },

          [poolWeightuuid]: {
            desc: t('Set Pools And Weights Contract'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      try {
        setPending(true)
        if (!(await writeTxn(key, operationsuuid, veTheAutomationContract, 'setOperations', [operations]))) {
          setPending(false)
          return false
        }

        if (!(await writeTxn(key, poolWeightuuid, veTheAutomationContract, 'setPoolsAndWeights', [pools, weights]))) {
          setPending(false)
          return false
        }

        endTxn({
          key,
          final: 'Edit Automation Contract Successful',
        })

        onSuccess()
        return true
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, endTxn, startTxn, t, writeTxn],
  )

  return { onEditAutomation, pending }
}
