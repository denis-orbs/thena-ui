import { useMemo } from 'react'

import { SolidlyPairABI } from '@/abis/solidly/SolidlyPairABI'
import { PAIR_TYPES } from '@/constant'
import { simulateCall } from '@/lib/contractActions'
import { fromWei, ZERO_VALUE } from '@/utils/utils'

import { useCachedSWR } from '../useCachedSWR'
import useWallet from '../useWallet'

const getFeesOfPools = async (pools, chainId) => {
  const feesOfPools = []
  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i]
    const isV1Pool = [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(pool.title)
    const poolFees = {
      feesInUsd: ZERO_VALUE,
      reward0: ZERO_VALUE,
      reward1: ZERO_VALUE,
    }

    try {
      const fees = await simulateCall({ abi: SolidlyPairABI, address: pool.address }, 'claimFees', [], chainId)

      const _reward0 = isV1Pool ? fromWei(fees?.[0] ?? 0n, pool.token0.decimals) : pool.account.token0claimable
      const _reward1 = isV1Pool ? fromWei(fees?.[1] ?? 0n, pool.token1.decimals) : pool.account.token1claimable
      const fees0 = _reward0?.times(pool.token0.price) || ZERO_VALUE
      const fees1 = _reward1?.times(pool.token1.price) || ZERO_VALUE

      poolFees.feesInUsd = fees0.plus(fees1)
      poolFees.reward0 = _reward0
      poolFees.reward1 = _reward1
    } catch (error) {
      // console.error(`Simulate failed for weighted position ${pool.address}:`, error)
    }

    feesOfPools.push(poolFees)
  }

  return feesOfPools
}

export const useNotStakedPositions = positions => {
  const { chainId, account } = useWallet()

  const dataKey = useMemo(
    () => (chainId && positions.length > 0 ? ['getFeesOfPoolsStakedPosition', chainId, positions, account] : null),
    [chainId, positions, account],
  )

  const { data } = useCachedSWR(dataKey, () => getFeesOfPools(positions, chainId), { refreshInterval: 60000 })

  return useMemo(
    () =>
      positions.map((pos, index) => ({
        ...pos,
        ...(data?.[index] ?? {}),
        apr: pos.feeApr,
        rewardUsd: Number(data?.[index]?.feesInUsd),
        fiatValueOfLiquidity: pos.account.totalUsd.minus(pos.account.stakedUsd),
        staked: false,
      })),
    [data, positions],
  )
}
