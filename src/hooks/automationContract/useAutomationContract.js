import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { v4 as uuidv4 } from 'uuid'
import { decodeEventLog, maxUint256, zeroAddress } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'

import { AUTOMATION_STATUS, PAIR_TYPES, TXN_STATUS } from '@/constant'
import { callMulti, readCall } from '@/lib/contractActions'
import {
  getKeeperRegistryContract,
  getLinkTokenContract,
  getVeTheAutomationContract,
  getVeTheAutomationFactoryContract,
  getVeTHEContract,
} from '@/lib/contracts'
import { convertBooleansToHex, convertHexToBooleans, fromWei, toWei } from '@/lib/utils'
import { useV3PoolsWithGauge } from '@/state/pools/hooks'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from '../useWallet'

export const useGetMaxPaymentForGas = () => {
  const { chainId } = useWallet()
  const registryContract = getKeeperRegistryContract(chainId)
  const { data: maxPayment } = useReadContract({
    ...registryContract,
    functionName: 'getMaxPaymentForGas',
    args: [0, 700000],
    enabled: Boolean(chainId),
  })

  // Add null check and provide default value
  if (!maxPayment) {
    return new BigNumber(0)
  }

  return fromWei(maxPayment)
}

export const useCreateAutomation = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)

  const { startTxn, endTxn, writeTxn, writeTxn2 } = useTxn()

  const handleGetAddress = useCallback(
    async txnReceipt => {
      try {
        const event = txnReceipt.logs[0]
        const eventLogs = decodeEventLog({
          abi: veTheAutomationFactoryContract.abi,
          data: event.data,
          topics: event.topics,
        })

        if (eventLogs?.args) {
          return eventLogs.args.automation
        }

        return ''
      } catch (error) {
        console.log('Failed to get automation address', error)
      }
    },
    [veTheAutomationFactoryContract],
  )

  const onCreateAutomation = useCallback(
    async (contract, onSuccess = () => {}) => {
      try {
        const key = uuidv4()
        const createAutouuid = uuidv4()
        const upkeepuuid = uuidv4()
        const approveAutomationuuid = uuidv4()
        const approveChainlinkuuid = uuidv4()
        const { settings, votes, registration } = contract

        const { pairs } = votes

        const { chainlink, chainlinkAmount } = registration

        const tokenId = contract.veTHEId
        // Save UTC
        const startTimestamp = settings.executionTime - new Date().getTimezoneOffset() * 60 * 1000
        const operations = convertBooleansToHex(votes.isAutoVote, settings.isClaimEveryWeek, settings.isRelockEveryWeek)
        const pools = pairs.map(pair => pair.pair.address)
        const weights = pairs.map(pair => pair.weight)

        const theContract = getVeTHEContract(chainId)
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
            [approveChainlinkuuid]: {
              desc: `${t('Approve')} ChainLink`,
              status: TXN_STATUS.START,
              hash: null,
            },
            [approveAutomationuuid]: {
              desc: t('Approve veTHE [tokenId]', { tokenId }),
              status: TXN_STATUS.START,
              hash: null,
            },
            [upkeepuuid]: {
              desc: t('Register [contractName] contract', { contractName: `veTHE Contract ${tokenId}` }),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        const txnReceipt = await writeTxn2(key, createAutouuid, veTheAutomationFactoryContract, 'createAutomation', [
          tokenId,
          Math.floor(startTimestamp / 1000),
          operations,
          pools,
          weights,
        ])

        if (!txnReceipt) {
          setPending(false)
          return false
        }

        const automationAddress = await handleGetAddress(txnReceipt)

        const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)

        const isApproveAutomation = await readCall(
          theContract,
          'isApprovedOrOwner',
          [automationAddress, tokenId],
          chainId,
        )

        const linkTokenContract = getLinkTokenContract(chainlink.address, chainId)
        if (
          !(await writeTxn(key, approveChainlinkuuid, linkTokenContract, 'approve', [automationAddress, maxUint256]))
        ) {
          setPending(false)
          return
        }

        if (!isApproveAutomation) {
          if (
            !(await writeTxn(key, approveAutomationuuid, theContract, 'setApprovalForAll', [automationAddress, true]))
          ) {
            setPending(false)
            return
          }
        }

        if (
          !(await writeTxn(key, upkeepuuid, veTheAutomationContract, 'registerUpkeep', [
            chainlink.address,
            toWei(chainlinkAmount),
          ]))
        ) {
          setPending(false)
          return false
        }

        endTxn({
          key,
          final: 'Create Automation Contract Successful',
        })
        onSuccess()

        return true
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, endTxn, handleGetAddress, startTxn, t, veTheAutomationFactoryContract, writeTxn, writeTxn2],
  )

  return { onCreateAutomation, pending }
}

export const getAutomationStatusString = status => {
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
      return AUTOMATION_STATUS.NO
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

export const useOperationsAutomation = id => {
  const { chainId } = useWallet()
  const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)
  const { data: operationData, isLoading } = useReadContract({
    ...veTheAutomationFactoryContract,
    functionName: 'tokenIdToAutomation',
    args: [id],
    enabled: Boolean(id) && Boolean(chainId),
  })

  const [isAutoVote, isClaimEveryWeek, isRelockEveryWeek] = convertHexToBooleans(operationData) || [[], [], []]

  return { isAutoVote, isClaimEveryWeek, isRelockEveryWeek, isLoading }
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

  const statusString = useMemo(() => getAutomationStatusString(status), [status])

  if (automationAddress === zeroAddress) {
    return { status: AUTOMATION_STATUS.NO, isLoading: isLoading1, mutateData: mutateData1 }
  }

  return { status: statusString, isLoading: isLoading2, mutateData: mutateData2 }
}

export const useStatusAndBalanceMultiple = veTHEs => {
  const { chainId } = useWallet()
  const fetchContractsStatusAndBalance = useCallback(async () => {
    const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)
    const contractsAddress = await callMulti(
      veTHEs.map(veTHE => ({
        ...veTheAutomationFactoryContract,
        functionName: 'tokenIdToAutomation',
        args: [veTHE.id],
        chainId,
      })),
    )

    const contractsStatus = await callMulti(
      contractsAddress.map(address => ({
        ...getVeTheAutomationContract(address, chainId),
        functionName: 'status',
      })),
    )

    const contractsBalance = await callMulti(
      contractsAddress.map(address => ({
        ...getVeTheAutomationContract(address, chainId),
        functionName: 'getBalance',
      })),
    )

    return veTHEs.map((veTHE, index) => {
      const status = contractsStatus[index] ?? null
      return {
        ...veTHE,
        contractAddress: contractsAddress[index],
        status,
        statusString: getAutomationStatusString(status),
        balanceAuto: contractsBalance[index] ?? null,
      }
    })
  }, [chainId, veTHEs])

  const { data, isLoading, mutate } = useSWR(
    ['fetchContractsStatus', chainId, veTHEs.length],
    () => fetchContractsStatusAndBalance(),
    {
      refreshInterval: 0,
    },
  )

  return { data, isLoading, mutate }
}

export const useAutomationContractDetail = tokenId => {
  const { chainId } = useWallet()
  const pools = useV3PoolsWithGauge()
  const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)

  const { data: automationAddress, refetch: mutateData1 } = useReadContract({
    ...veTheAutomationFactoryContract,
    functionName: 'tokenIdToAutomation',
    args: [tokenId],
    enabled: Boolean(tokenId) && Boolean(chainId),
  })

  const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)

  const {
    data: contractInfo,
    isLoading,
    refetch: mutateData2,
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
          pair: {
            address: result.address,
            basePool: result.basePool,
            lpPrice: result.lpPrice,
            stable: result.stable,
            symbol: result.symbol,
            title: result.title,
            type: result.type,
            version: result.version,
            ...(result.type === PAIR_TYPES.WEIGHTED
              ? {
                  tokens: (result.tokens || []).map(token => ({
                    ...token,
                    totalValue: token?.totalValue?.toNumber() || 0,
                    balance: token?.balance?.toNumber() || 0,
                  })),
                }
              : {
                  token0: {
                    ...result.token0,
                    reserve: result?.token0?.reserve?.toNumber() || 0,
                    balance: result?.token0?.balance?.toNumber() || 0,
                  },
                  token1: {
                    ...result.token1,
                    reserve: result?.token1?.reserve?.toNumber() || 0,
                    balance: result?.token1?.balance?.toNumber() || 0,
                  },
                }),
          },
          weight: Number(weights[index]),
          lock: true,
        }
      : {
          pair: undefined,
          weight: Number(weights[index]),
          lock: true,
        }
  })

  const statusString = useMemo(() => getAutomationStatusString(status), [status])

  const contractData = {
    address: automationAddress,
    veTHEId: tokenId,
    contractName: `veTHE Automation - ID ${tokenId}`,
    settings: {
      isClaimEveryWeek,
      isRelockEveryWeek,
      executionTime: Number(runTimestamp) * 1000 + new Date().getTimezoneOffset() * 60 * 1000,
    },
    votes: {
      isAutoVote,
      pairs,
    },
    status: statusString,
    balance: Number(balance?.toString() || '0'),
    gasLimit,
    forwarder,
  }

  const mutateAutomationData = useCallback(() => {
    mutateData1()
    mutateData2()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutateData1, mutateData2, tokenId])

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
            desc: t('Edit Setting'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      try {
        setPending(true)
        if (
          !(await writeTxn(key, operationsuuid, veTheAutomationContract, 'setOperations', [operations, pools, weights]))
        ) {
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

export const useActiveAutomation = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()
  const onActive = useCallback(
    async (automationAddress, tokenId, chainlink, chainlinkAmount, onSuccess) => {
      const key = uuidv4()
      const upkeepuuid = uuidv4()
      const approveAutomationuuid = uuidv4()
      const approveChainlinkuuid = uuidv4()

      const theContract = getVeTHEContract(chainId)
      setPending(true)

      startTxn({
        key,
        title: 'Active Automation Contract',
        transactions: {
          [approveChainlinkuuid]: {
            desc: t('Approve LINK'),
            status: TXN_STATUS.START,
            hash: null,
          },
          [approveAutomationuuid]: {
            desc: t('Approve veTHE [tokenId]', { tokenId }),
            status: TXN_STATUS.START,
            hash: null,
          },
          [upkeepuuid]: {
            desc: t('Register [contractName] contract', { contractName: `veTHE Contract ${tokenId}` }),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      try {
        const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)

        const isApproveAutomation = await readCall(
          theContract,
          'isApprovedOrOwner',
          [automationAddress, tokenId],
          chainId,
        )
        const linkTokenContract = getLinkTokenContract(chainlink.address, chainId)
        if (
          !(await writeTxn(key, approveChainlinkuuid, linkTokenContract, 'approve', [automationAddress, maxUint256]))
        ) {
          setPending(false)
          return
        }

        if (!isApproveAutomation) {
          if (
            !(await writeTxn(key, approveAutomationuuid, theContract, 'setApprovalForAll', [automationAddress, true]))
          ) {
            setPending(false)
            return
          }
        }

        if (
          !(await writeTxn(key, upkeepuuid, veTheAutomationContract, 'registerUpkeep', [
            chainlink.address,
            toWei(chainlinkAmount),
          ]))
        ) {
          setPending(false)
          return false
        }

        endTxn({
          key,
          final: 'Create Automation Contract Successful',
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

  return { onActive, pending }
}

export const useEditGasLimit = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onEditGasLimit = useCallback(
    async (address, gasLimit, onSuccess = () => {}) => {
      try {
        const veTheAutomationContract = getVeTheAutomationContract(address, chainId)
        const key = uuidv4()
        const editGasLimituuid = uuidv4()
        setPending(true)

        startTxn({
          key,
          title: 'Edit gas limit',
          transactions: {
            [editGasLimituuid]: {
              desc: t('Edit gas limit'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (!(await writeTxn(key, editGasLimituuid, veTheAutomationContract, 'setUpkeepGasLimit', [gasLimit]))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Edit gas limit Successful',
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
  return { onEditGasLimit, pending }
}

export const useEditMaxGasPrice = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onEditMaxGasPrice = useCallback(
    async (address, max, onSuccess = () => {}) => {
      try {
        const veTheAutomationContract = getVeTheAutomationContract(address, chainId)
        const key = uuidv4()
        const editGasLimituuid = uuidv4()
        setPending(true)

        startTxn({
          key,
          title: 'Edit max gas price',
          transactions: {
            [editGasLimituuid]: {
              desc: t('Edit max gas price'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (!(await writeTxn(key, editGasLimituuid, veTheAutomationContract, 'setMaxGasPrice', [max]))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Edit max gas price Successful',
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
  return { onEditMaxGasPrice, pending }
}

export const useSetRunTimestamp = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onSetRunTimestamp = useCallback(
    async (address, timestamp, onSuccess = () => {}) => {
      try {
        const veTheAutomationContract = getVeTheAutomationContract(address, chainId)
        const key = uuidv4()
        const setRunTimesuuid = uuidv4()
        setPending(true)
        const startTimestamp = timestamp - new Date().getTimezoneOffset() * 60 * 1000
        startTxn({
          key,
          title: 'Set Run Timestamp',
          transactions: {
            [setRunTimesuuid]: {
              desc: t('Set Run Timestamp'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (
          !(await writeTxn(key, setRunTimesuuid, veTheAutomationContract, 'setRunTimestamp', [
            Math.floor(startTimestamp / 1000),
          ]))
        ) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Set Run Timestamp Successful',
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
  return { onSetRunTimestamp, pending }
}

export const useDepositFunds = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onDepositFunds = useCallback(
    async (automationAddress, tokenAddress, amount, onSuccess = () => {}) => {
      try {
        const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)
        const linkTokenContract = getLinkTokenContract(tokenAddress, chainId)
        const key = uuidv4()
        const deposituuid = uuidv4()
        const approveuuid = uuidv4()
        setPending(true)

        const allowance = await readCall(linkTokenContract, 'allowance', [account, automationAddress], chainId)
        const isApproved = fromWei(allowance).gte(amount)

        startTxn({
          key,
          title: 'Funding Contract',
          transactions: {
            ...(!isApproved && {
              [approveuuid]: {
                desc: `${t('Approve')} LINK`,
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [deposituuid]: {
              desc: t('Deposit LINK'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (!isApproved) {
          if (!(await writeTxn(key, approveuuid, linkTokenContract, 'approve', [automationAddress, maxUint256]))) {
            setPending(false)
            return
          }
        }

        if (
          !(await writeTxn(key, deposituuid, veTheAutomationContract, 'depositFunds', [tokenAddress, toWei(amount)]))
        ) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Edit max gas price Successful',
        })

        onSuccess()

        return true
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    },
    [account, chainId, endTxn, startTxn, t, writeTxn],
  )
  return { onDepositFunds, pending }
}

export const useWithdrawFunds = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onWithdrawFunds = useCallback(
    async (automationAddress, tokenAddress, onSuccess = () => {}) => {
      try {
        const veTheAutomationContract = getVeTheAutomationContract(automationAddress, chainId)
        const key = uuidv4()
        const withdrawuuid = uuidv4()
        setPending(true)

        startTxn({
          key,
          title: 'Withdraw funds',
          transactions: {
            [withdrawuuid]: {
              desc: t('Withdraw'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (!(await writeTxn(key, withdrawuuid, veTheAutomationContract, 'withdrawFunds', [tokenAddress]))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Withdraw funds Successful',
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
  return { onWithdrawFunds, pending }
}
