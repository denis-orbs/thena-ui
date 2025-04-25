import { useRef } from 'react'
import useSWR from 'swr'
import { isAddress } from 'viem'

import { PAIR_TYPES } from '@/constant'
import { pairAbi } from '@/constant/abi'
import { simulateCall } from '@/lib/contractActions'
import { fromWei, ZERO_VALUE } from '@/lib/utils'

import useWallet from '../useWallet'

const getNormalPosition = async ({ positions = [], chainId, isStaked }) =>
  await Promise.all(
    positions.map(async position => {
      // just for not stake
      const isV1Pool = [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(position.title)
      let fees
      if (isV1Pool && isAddress(position.address) && !isStaked) {
        try {
          fees = await simulateCall({ abi: pairAbi, address: position.address }, 'claimFees', [], chainId)
        } catch (err) {
          console.error('simulateCall failed', err)
          fees = [0n, 0n]
        }
      }
      const _reward0 = isV1Pool ? fromWei(fees?.[0] ?? 0n, position.token0.decimals) : position.account.token0claimable
      const _reward1 = isV1Pool ? fromWei(fees?.[1] ?? 0n, position.token1.decimals) : position.account.token1claimable

      const fees0 = _reward0?.times(position.token0.price) || ZERO_VALUE
      const fees1 = _reward1?.times(position.token1.price) || ZERO_VALUE

      const feesInUsd = fees0.plus(fees1)

      return {
        position: {
          ...position,
          isStaked,
        },
        apr: isStaked ? position.gauge.apr.toNumber() : position.feeApr,
        depositLiquidity: isStaked
          ? position?.title.includes('SwapFee')
            ? position?.account.totalUsd.toNumber()
            : position.account.stakedUsd.toNumber()
          : position.account.totalUsd.minus(position.account.stakedUsd).toNumber(),
        rewardUsd: Number(isStaked ? position.account.earnedUsd : feesInUsd),
      }
    }),
  )
export const useNormalStakedPositions = (positions = []) => {
  const { account, chainId } = useWallet()
  const prevData = useRef([])

  const {
    data: positionsData,
    isLoading,
    error,
  } = useSWR(
    positions.length > 0 && ['get normal data staked', chainId, account, positions],
    () =>
      getNormalPosition({
        positions,
        chainId,
        isStaked: true,
      }),
    {
      refreshInterval: 0,
    },
  )
  if (positionsData && !isLoading) {
    prevData.current = positionsData
  }

  if (error || isLoading) {
    return { positionsData: prevData.current, isLoading: false }
  }

  return { positionsData, isLoading }
}

export const useNormalUnStakedPositions = (positions = []) => {
  const { account, chainId } = useWallet()
  const prevData = useRef([])

  const {
    data: positionsData,
    isLoading,
    error,
  } = useSWR(
    positions.length > 0 && ['get normal data unStaked', chainId, account, positions],
    () =>
      getNormalPosition({
        positions,
        chainId,
        isStaked: false,
      }),
    {
      refreshInterval: 0,
    },
  )
  if (positionsData && !isLoading) {
    prevData.current = positionsData
  }

  if (error || isLoading) {
    return { positionsData: prevData.current, isLoading: false }
  }

  return { positionsData, isLoading }
}
