import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { zeroAddress } from 'viem'

import { GAMMA_TYPES, ICHI_TYPES, PAIR_TYPES } from '@/constant'
import { useWeightedPoolsWithGauge } from '@/hooks/weightedPool/useWeigtedPool'
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

export const usePoolsWithGauge = () => {
  const pools = usePools()
  const weightedPoolsWithGauge = useWeightedPoolsWithGauge()

  const poolsWithGauge = useMemo(() => (pools ? pools.filter(pool => pool.gauge.address !== zeroAddress) : []), [pools])

  return [...poolsWithGauge, ...weightedPoolsWithGauge]
}

export const useGetAutoPoolMigration = ({ token0Address, token1Address, type, version }) => {
  const { autoPoolsMigration } = useSelector(state => state.pools)
  if (version === 3) return null

  let strategy = null
  if (GAMMA_TYPES.includes(type)) {
    strategy = 'gamma'
  } else if (ICHI_TYPES.includes(type)) {
    strategy = 'ichi'
  }

  if (!strategy) return null
  return autoPoolsMigration[strategy].filter(
    pool =>
      (pool.token0.address === token0Address && pool.token1.address === token1Address) ||
      (pool.token0.address === token1Address && pool.token1.address === token0Address),
  )
}
