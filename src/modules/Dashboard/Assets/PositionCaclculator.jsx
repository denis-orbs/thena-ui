import { useEffect, useMemo } from 'react'
import { isAddress } from 'viem'
import { useSimulateContract } from 'wagmi'

import { PAIR_TYPES } from '@/constant'
import { pairAbi } from '@/constant/abi'
import { fromWei, ZERO_VALUE } from '@/lib/utils'

function PositionCaclculator({ position, isStaked, onData = () => {}, index }) {
  // just for not stake
  const isV1Pool = useMemo(() => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(position.title), [position.title])
  const { data: fees } = useSimulateContract({
    abi: pairAbi,
    address: position.address,
    functionName: 'claimFees',
    query: {
      enable: isV1Pool && isAddress(position.address) && !isStaked,
    },
  })
  const { feesInUsd } = useMemo(() => {
    const _reward0 = isV1Pool
      ? fromWei(fees?.result?.[0] ?? 0n, position.token0.decimals)
      : position.account.token0claimable
    const _reward1 = isV1Pool
      ? fromWei(fees?.result?.[1] ?? 0n, position.token1.decimals)
      : position.account.token1claimable

    const fees0 = _reward0?.times(position.token0.price) || ZERO_VALUE
    const fees1 = _reward1?.times(position.token1.price) || ZERO_VALUE

    return {
      feesInUsd: fees0.plus(fees1),
      reward0: _reward0,
      reward1: _reward1,
    }
  }, [
    fees?.result,
    isV1Pool,
    position.account.token0claimable,
    position.account.token1claimable,
    position.token0.decimals,
    position.token0.price,
    position.token1.decimals,
    position.token1.price,
  ])

  // Set value
  useEffect(() => {
    onData({
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
      index,
    })
  }, [feesInUsd, index, isStaked, onData, position])

  return null
}

export default PositionCaclculator
