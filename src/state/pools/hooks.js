import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { zeroAddress } from 'viem'

import { GAMMA_TYPES, ICHI_TYPES, PAIR_TYPES } from '@/constant'
import { useFusionPairs } from '@/context/fusionsContext'
import { usePairs } from '@/context/pairsContext'
import { useWeightedPools } from '@/hooks/weightedPool/useWeigtedPool'
import { fetchV2SolidlyPairs } from '@/lib/api'
import { ZERO_VALUE } from '@/lib/utils'

import { useChainSettings } from '../settings/hooks'

export const usePools = () => {
  const { data } = useSelector(state => state.pools)
  const { networkId } = useChainSettings()

  return useMemo(
    () =>
      data[networkId].map(fusion => {
        const { account } = fusion
        return {
          ...fusion,
          tvl: new BigNumber(fusion.tvl),
          gauge: {
            ...fusion.gauge,
            tvl: new BigNumber(fusion.gauge.tvl),
            apr: new BigNumber(fusion.gauge.apr || 0),
            voteApr: new BigNumber(fusion.gauge.voteApr),
            projectedApr: new BigNumber(fusion.gauge.projectedApr),
            weight: new BigNumber(fusion.gauge.weight),
            weightPercent: new BigNumber(fusion.gauge.weightPercent),
            bribeUsd: new BigNumber(fusion.gauge.bribeUsd),
            pooled0: new BigNumber(fusion.gauge.pooled0),
            pooled1: new BigNumber(fusion.gauge.pooled1),
          },
          token0: {
            ...fusion.token0,
            reserve: new BigNumber(fusion.token0.reserve),
          },
          token1: {
            ...fusion.token1,
            reserve: new BigNumber(fusion.token1.reserve),
          },
          account: {
            ...account,
            walletBalance: new BigNumber(account.walletBalance),
            gaugeBalance: new BigNumber(account.gaugeBalance),
            totalLp: new BigNumber(account.totalLp),
            staked0:
              fusion.totalSupply > 0
                ? new BigNumber(account.gaugeBalance).times(fusion.token0.reserve).div(fusion.totalSupply)
                : ZERO_VALUE,
            staked1:
              fusion.totalSupply > 0
                ? new BigNumber(account.gaugeBalance).times(fusion.token1.reserve).div(fusion.totalSupply)
                : ZERO_VALUE,
            stakedUsd: new BigNumber(account.stakedUsd),
            earnedUsd: new BigNumber(account.earnedUsd),
            total0: fusion.totalSupply
              ? new BigNumber(account.totalLp).times(fusion.token0.reserve).div(fusion.totalSupply)
              : ZERO_VALUE,
            total1: fusion.totalSupply
              ? new BigNumber(account.totalLp).times(fusion.token1.reserve).div(fusion.totalSupply)
              : ZERO_VALUE,
            totalUsd: new BigNumber(account.totalUsd),
            gaugeEarned: new BigNumber(account.gaugeEarned),
            token0claimable: new BigNumber(account.token0claimable),
            token1claimable: new BigNumber(account.token1claimable),
          },
        }
      }),
    [data, networkId],
  )
}

export const useGammas = () => {
  const pools = usePools()

  return useMemo(
    () => pools.filter(pool => pool.type === PAIR_TYPES.LSD && !['ICHI', 'DefiEdge'].includes(pool.title)),
    [pools],
  )
}

export const useDefiedges = () => {
  const pools = usePools()

  return useMemo(() => pools.filter(pool => pool.title === 'DefiEdge'), [pools])
}

export const useV3PoolsWithGauge = (isAlive = true) => {
  const pools = usePools()
  const weightedPools = useWeightedPools()

  return useMemo(() => {
    if (!Array.isArray(pools) || !Array.isArray(weightedPools)) return []

    return [...pools, ...weightedPools].filter(pool => {
      const hasGauge = pool.version === 3 && pool.gauge.address !== zeroAddress
      return isAlive ? hasGauge && pool.gauge.isAlive : hasGauge
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAlive, pools, weightedPools.length])
}

export const getStrategy = type => {
  if (GAMMA_TYPES.includes(type)) {
    return 'gamma'
  }
  if (ICHI_TYPES.includes(type)) {
    return 'ichi'
  }
  if (type === PAIR_TYPES.CLASSIC) {
    return 'classic'
  }
  if (type === PAIR_TYPES.STABLE) {
    return 'stable'
  }
  return null
}

export const useGetAutoPoolMigration = ({ token0Address, token1Address, type, version }) => {
  const { autoPoolsMigration } = useSelector(state => state.pools)
  if (version === 3) return null
  const strategy = getStrategy(type)

  if (!strategy) return null
  return autoPoolsMigration[strategy].filter(
    pool =>
      (pool.token0.address === token0Address && pool.token1.address === token1Address) ||
      (pool.token0.address === token1Address && pool.token1.address === token0Address),
  )
}

export const useGetV2SolidlyPairs = pairType => {
  const { networkId } = useChainSettings()

  const { data: v2Pairs = [] } = useQuery({
    queryKey: ['v2-solidly-pairs'],
    queryFn: () => fetchV2SolidlyPairs({ networkId }),
    enabled: pairType === PAIR_TYPES.CLASSIC || pairType === PAIR_TYPES.STABLE,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  return { v2Pairs }
}

export const usePairInfo = ({ token0Address, token1Address, type, poolAddress }) => {
  const { pairs } = usePairs()
  const fusionPairs = useFusionPairs()
  const { v2Pairs } = useGetV2SolidlyPairs(type)

  return useMemo(() => {
    const found = [...pairs, ...v2Pairs].find(
      pair =>
        (pair.address === poolAddress ||
          (pair.token0?.address === token0Address && pair.token1?.address === token1Address) ||
          (pair.token0?.address === token1Address && pair.token1?.address === token0Address)) &&
        pair.type === type,
    )
    if (!found) return

    const fusionPool = (fusionPairs ?? []).find(ele => found?.address?.toLowerCase() === ele.address)
    return {
      ...found,
      currentTick: Number(fusionPool?.globalState.tick || 0),
    }
  }, [fusionPairs, pairs, poolAddress, token0Address, token1Address, type, v2Pairs])
}
