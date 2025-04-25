import { useMemo } from 'react'

export const useStakedPosition = positions =>
  useMemo(
    () =>
      positions.map(pos => ({
        ...pos,
        apr: pos.gauge.apr,
        rewardUsd: Number(pos.account.earnedUsd),
        fiatValueOfLiquidity: pos?.title.includes('SwapFee') ? pos?.account.totalUsd : pos.account.stakedUsd,
        staked: true,
      })),
    [positions],
  )
