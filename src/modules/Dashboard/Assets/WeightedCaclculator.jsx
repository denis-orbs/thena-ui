import { useEffect } from 'react'

import { usePositionData } from '@/hooks/weightedPool/useWeigtedPool'

function WeightedCaclculator({ position, isStake, onData, index }) {
  const { claimableFee, depositValue } = usePositionData(position, isStake)
  useEffect(() => {
    onData({
      position,
      apr: Number(position.apr.replace('%', '')),
      depositLiquidity: depositValue.depositUsd.toNumber(),
      rewardUsd: Number(claimableFee?.total),
      index,
    })
  }, [claimableFee?.total, depositValue.depositUsd, index, onData, position])
  return null
}

export default WeightedCaclculator
