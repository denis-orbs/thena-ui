import BigNumber from 'bignumber.js'
import { useMemo, useRef } from 'react'
import useSWR from 'swr'

import { PAIR_TYPES } from '@/constant'
import { pairAbi } from '@/constant/abi'
import { simulateCall } from '@/lib/contractActions'
import { fromWei, ZERO_VALUE } from '@/lib/utils'

import useWallet from '../useWallet'

const getFeesOfPools = async (pools, chainId) => {
  const feesOfPools = []
  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i]
    const isV1Pool = [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(pool.title)
    try {
      const fees = await simulateCall({ abi: pairAbi, address: pool.address }, 'claimFees', [], chainId)
      const _reward0 = isV1Pool ? fromWei(fees?.result?.[0] ?? 0n, pool.token0.decimals) : pool.account.token0claimable
      const _reward1 = isV1Pool ? fromWei(fees?.result?.[1] ?? 0n, pool.token1.decimals) : pool.account.token1claimable

      const fees0 = _reward0?.times(pool.token0.price) || ZERO_VALUE
      const fees1 = _reward1?.times(pool.token1.price) || ZERO_VALUE
      feesOfPools.push({
        feesInUsd: fees0.plus(fees1),
        reward0: _reward0,
        reward1: _reward1,
      })
    } catch (error) {
      console.error(`Simulate failed for weighted position ${pool.address}:`, error)
      feesOfPools.push({
        feesInUsd: BigNumber(0),
        reward0: 0n,
        reward1: 0n,
      })
    }
  }
  return feesOfPools
}

export const useNotStakedPositions = positions => {
  const { chainId, account } = useWallet()
  const prevData = useRef([])
  const { data, isLoading } = useSWR(
    chainId && positions.length > 0 && ['getFeesOfPoolsStakedPosition', chainId, positions, account],
    () => getFeesOfPools(positions, chainId),
    {
      refreshInterval: 60000,
    },
  )
  const _data = useMemo(() => {
    if (!data || isLoading) return prevData.current
    prevData.current = data
    return data
  }, [data, isLoading])
  return useMemo(
    () =>
      positions.map((pos, index) => ({
        ...pos,
        ...(_data?.[index] ?? {}),
        apr: pos.feeApr,
        rewardUsd: Number(_data?.[index]?.feesInUsd),
        fiatValueOfLiquidity: pos.account.totalUsd.minus(pos.account.stakedUsd),
        staked: false,
      })),
    [_data, positions],
  )
}
