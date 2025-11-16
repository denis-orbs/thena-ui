import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { decodeEventLog, erc20Abi, maxUint256 } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'

import { VeTheAutomationABI } from '@/abis/automation/VeTheAutomationABI'
import { VeTheAutomationFactoryABI } from '@/abis/automation/VeTheAutomationFactoryABI'
import { useVeTHEsContext } from '@/app/dashboard/VeTHEsContext'
import { AUTOMATION_STATUS, CHAINLINK_TOKEN, PAIR_TYPES, TXN_STATUS } from '@/constant'
import Contracts, { CHAIN_ID } from '@/constant/contracts'
import { callMulti, readCall } from '@/lib/contractActions'
import { getVeTHEContract } from '@/lib/contracts'
import { convertBooleansToHex, convertHexToBooleans, fromWei, toWei } from '@/lib/utils'
import { useV3PoolsWithGauge } from '@/state/pools/hooks'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from '../useWallet'

const DEFAULT_LINK_REQUIRE = 0.5

const getVeTheAutoContract = address => ({
  address,
  abi: VeTheAutomationABI,
})

const VeTheAutomationFactoryContract = {
  address: Contracts.veTheAutomationFactory[CHAIN_ID.BSC],
  abi: VeTheAutomationFactoryABI,
}

export const useGetMinimumFunds = (veTHEId, operations, poolLength) => {
  const { chainId } = useWallet()

  // Get minimum fund chainLINK
  const { data: minimumFunds, isLoading } = useReadContract({
    ...VeTheAutomationFactoryContract,
    functionName: 'getMinimumFunds',
    args: [operations, poolLength],
    enabled: Boolean(veTHEId) && Boolean(chainId),
  })

  // Add null check and provide default value
  if (!minimumFunds) {
    return new BigNumber(0)
  }

  return { minimumFunds: fromWei(minimumFunds).plus(DEFAULT_LINK_REQUIRE), isLoading }
}

export const useCreateAutomation = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn, writeTxn2 } = useTxn()

  const handleGetAddress = useCallback(async txnReceipt => {
    try {
      const event = txnReceipt.logs[0]
      const eventLogs = decodeEventLog({
        abi: VeTheAutomationFactoryContract.abi,
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
  }, [])

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
        const operations = convertBooleansToHex(votes.isAutoVote, settings.isRelockEveryWeek, settings.isClaimEveryWeek)
        const pools = pairs.filter(item => Boolean(item.pair)).map(pair => pair?.pair?.address)
        const weights = pairs.filter(item => Boolean(item.pair)).map(pair => pair.weight)
        console.log({ pools, weights, operations, startTimestamp })
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

        const txnReceipt = await writeTxn2(key, createAutouuid, VeTheAutomationFactoryContract, 'createAutomation', [
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

        const veTheAutomationContract = getVeTheAutoContract(automationAddress)

        const isApproveAutomation = await readCall(
          theContract,
          'isApprovedOrOwner',
          [automationAddress, tokenId],
          chainId,
        )

        const linkTokenContract = {
          address: chainlink.address,
          abi: erc20Abi,
        }
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
    [chainId, endTxn, handleGetAddress, startTxn, t, writeTxn, writeTxn2],
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

export const useVeTheAutomations = () => {
  const { chainId } = useWallet()
  const { veTHEs } = useVeTHEsContext()

  const fetchAutomationContracts = useCallback(async () => {
    const contractAddresses = await callMulti(
      veTHEs.map(veTHE => ({
        ...VeTheAutomationFactoryContract,
        functionName: 'tokenIdToAutomation',
        args: [veTHE.id],
        chainId,
      })),
    )

    const contractsStatuses = await callMulti(
      contractAddresses.map(address => ({
        ...getVeTheAutoContract(address),
        functionName: 'status',
      })),
    )

    // Min balance for the automation to run
    const contractsMinBalance = await callMulti(
      contractAddresses.map(address => ({
        ...getVeTheAutoContract(address),
        functionName: 'getMinBalance',
      })),
    )

    // LINK balance of the automation
    const contractsBalance = await callMulti(
      contractAddresses.map(address => ({
        ...getVeTheAutoContract(address),
        functionName: 'getBalance',
      })),
    )

    // Automation operations
    const contractsOperationsHex = await callMulti(
      contractAddresses.map(address => ({
        ...getVeTheAutoContract(address),
        functionName: 'operations',
      })),
    )

    return veTHEs.map((veTHE, index) => {
      const status = contractsStatuses[index] ?? null
      const [isAutoVote, isRelockEveryWeek, isClaimEveryWeek] = convertHexToBooleans(contractsOperationsHex[index])

      return {
        ...veTHE,
        contractAddress: contractAddresses[index],
        status,
        statusString: getAutomationStatusString(status),
        minBalanceAuto: fromWei(contractsMinBalance[index]) ?? new BigNumber(0),
        balanceAuto: fromWei(contractsBalance[index]) ?? new BigNumber(0),
        operations: { isAutoVote, isClaimEveryWeek, isRelockEveryWeek },
      }
    })
  }, [chainId, veTHEs])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fetchVeTheAutomations', chainId, veTHEs.length],
    queryFn: () => fetchAutomationContracts(),
    enabled: Boolean(chainId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, refetch }
}

export const useAutomationContractDetail = tokenId => {
  const { chainId } = useWallet()
  const pools = useV3PoolsWithGauge()

  const { data: automationAddress, refetch: mutateData1 } = useReadContract({
    ...VeTheAutomationFactoryContract,
    functionName: 'tokenIdToAutomation',
    args: [tokenId],
    enabled: Boolean(tokenId) && Boolean(chainId),
  })

  const veTheAutomationContract = getVeTheAutoContract(automationAddress)

  const {
    data: contractInfo,
    isLoading,
    refetch: mutateData2,
  } = useReadContracts({
    contracts: [
      { ...veTheAutomationContract, functionName: 'getBalance' },
      { ...veTheAutomationContract, functionName: 'getPoolsAndWeights' },
      { ...veTheAutomationContract, functionName: 'operations' },
      { ...veTheAutomationContract, functionName: 'lastExecutionTime' },
      { ...veTheAutomationContract, functionName: 'status' },
      { ...veTheAutomationContract, functionName: 'upkeepGasLimit' },
      { ...veTheAutomationContract, functionName: 'forwarder' },
      { ...veTheAutomationContract, functionName: 'getMinBalance' },
    ],
    query: {
      enabled: Boolean(tokenId),
    },
  })

  const balance = contractInfo?.[0]?.result

  const [poolsAddress = [], weights = []] = contractInfo?.[1]?.result || [[], []]

  const operations = contractInfo?.[2]?.result
  const [isAutoVote, isRelockEveryWeek, isClaimEveryWeek] = convertHexToBooleans(operations) || [[], [], []]
  const { result: lastExecutionTime } = contractInfo?.[3] || {}
  const { result: status } = contractInfo?.[4] || {}
  const gasLimit = contractInfo?.[5]?.result || 0
  const forwarder = contractInfo?.[6]?.result || null
  const minBalance = contractInfo?.[7]?.result || 0

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
                    totalValue: token?.totalValue || 0,
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
      executionTime: Number(lastExecutionTime) * 1000 + new Date().getTimezoneOffset() * 60 * 1000,
    },
    votes: {
      isAutoVote,
      pairs,
    },
    status: statusString,
    balance: Number(balance?.toString() || '0'),
    gasLimit,
    forwarder,
    minBalance: Number(minBalance?.toString() || '0'),
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

  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onPauseAutomation = useCallback(
    async (automationAddress, type, onSuccess) => {
      const key = uuidv4()
      const pauseuuid = uuidv4()
      const veTheAutomationContract = getVeTheAutoContract(automationAddress)

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
    [endTxn, startTxn, t, writeTxn],
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
      const withdrawuuid = uuidv4()
      const veTheAutomationContract = getVeTheAutoContract(automationAddress)

      const erc20Address = CHAINLINK_TOKEN[chainId][0].address

      startTxn({
        key,
        title: 'Cancel Automation Contract',
        transactions: {
          [canceluuid]: {
            desc: t('Cancel'),
            status: TXN_STATUS.START,
            hash: null,
          },
          [withdrawuuid]: {
            desc: t('Withdraw'),
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

        if (!(await writeTxn(key, withdrawuuid, veTheAutomationContract, 'withdrawFunds', [erc20Address]))) {
          setPending(false)
          return
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

  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onEditAutomation = useCallback(
    async (contract, onSuccess = () => {}) => {
      const key = uuidv4()
      const operationsuuid = uuidv4()
      const veTheAutomationContract = getVeTheAutoContract(contract.address)

      const { settings, votes } = contract

      const { pairs } = votes

      const operations = convertBooleansToHex(votes.isAutoVote, settings.isRelockEveryWeek, settings.isClaimEveryWeek)
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
    [endTxn, startTxn, t, writeTxn],
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

      const veTheContract = getVeTHEContract(chainId)
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
        const veTheAutomationContract = getVeTheAutoContract(automationAddress)

        const isApproveAutomation = await readCall(
          veTheContract,
          'isApprovedOrOwner',
          [automationAddress, tokenId],
          chainId,
        )
        const linkTokenContract = {
          address: chainlink.address,
          abi: erc20Abi,
        }
        if (
          !(await writeTxn(key, approveChainlinkuuid, linkTokenContract, 'approve', [automationAddress, maxUint256]))
        ) {
          setPending(false)
          return
        }

        if (!isApproveAutomation) {
          if (
            !(await writeTxn(key, approveAutomationuuid, veTheContract, 'setApprovalForAll', [automationAddress, true]))
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
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onEditGasLimit = useCallback(
    async (address, gasLimit, onSuccess = () => {}) => {
      try {
        const veTheAutomationContract = getVeTheAutoContract(address)
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
    [endTxn, startTxn, t, writeTxn],
  )
  return { onEditGasLimit, pending }
}

export const useEditMaxGasPrice = () => {
  const [pending, setPending] = useState(false)
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onEditMaxGasPrice = useCallback(
    async (address, max, onSuccess = () => {}) => {
      try {
        const veTheAutomationContract = getVeTheAutoContract(address)
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
    [endTxn, startTxn, t, writeTxn],
  )
  return { onEditMaxGasPrice, pending }
}

export const useSetRunTimestamp = () => {
  const [pending, setPending] = useState(false)
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onSetRunTimestamp = useCallback(
    async (address, timestamp, onSuccess = () => {}) => {
      try {
        const veTheAutomationContract = getVeTheAutoContract(address)
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
          !(await writeTxn(key, setRunTimesuuid, veTheAutomationContract, 'setExecutionTime', [
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
    [endTxn, startTxn, t, writeTxn],
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
        const veTheAutomationContract = getVeTheAutoContract(automationAddress)
        const linkTokenContract = {
          address: tokenAddress,
          abi: erc20Abi,
        }
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
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onWithdrawFunds = useCallback(
    async (automationAddress, tokenAddress, onSuccess = () => {}) => {
      try {
        const veTheAutomationContract = getVeTheAutoContract(automationAddress)
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
    [endTxn, startTxn, t, writeTxn],
  )
  return { onWithdrawFunds, pending }
}
