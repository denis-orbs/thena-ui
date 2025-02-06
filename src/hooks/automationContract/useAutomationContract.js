import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import useSWR from 'swr'
import { v4 as uuidv4 } from 'uuid'
import { useReadContract, useReadContracts } from 'wagmi'

import { TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getVeTheAutomationContract, getVeTheAutomationFactoryContract } from '@/lib/contracts'
import { convertBooleansToHex, convertHexToBooleans } from '@/lib/utils'
import { usePoolsWithGauge } from '@/state/pools/hooks'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from '../useWallet'

export const useCreateAutomation = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onCreateAutomation = useCallback(
    async contract => {
      const key = uuidv4()
      const createAutouuid = uuidv4()
      const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)
      const { settings, votes } = contract

      const { pairs } = votes

      const tokenId = contract.veTHEId
      const startTimestamp = settings.executionTime
      const operations = convertBooleansToHex(votes.isAutoVote, settings.isClaimEveryWeek, settings.isRelockEveryWeek)
      const pools = pairs.map(pair => pair.pair.address)
      const weights = pairs.map(pair => pair.weight)

      startTxn({
        key,
        title: 'Create Automation Contract',
        transactions: {
          [createAutouuid]: {
            desc: t('Create'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      try {
        setPending(true)
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

export const useIsAutomation = address => {
  const { chainId } = useWallet()

  const isAutomation = useCallback(async () => {
    const veTheAutomationFactoryContract = getVeTheAutomationFactoryContract(chainId)
    const isAuto = await readCall(veTheAutomationFactoryContract, 'isAutomation', [address], chainId)
    return isAuto
  }, [address, chainId])

  const { data, isLoading } = useSWR(['fetch is automation', address], () => isAutomation(), {
    refreshInterval: 0,
  })

  return { data, isLoading }
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

  const { data: contractInfo, isLoading } = useReadContracts({
    contracts: [
      { ...veTheAutomationContract, functionName: 'getBalance' },
      { ...veTheAutomationContract, functionName: 'getPoolsAndWeights' },
      { ...veTheAutomationContract, functionName: 'operations' },
      { ...veTheAutomationContract, functionName: 'runTimestamp' },
      { ...veTheAutomationContract, functionName: 'status' },
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

  const contractData = {
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
    status,
    balance: balance?.toString() || '0',
  }

  return { contractData, isLoading }
}
