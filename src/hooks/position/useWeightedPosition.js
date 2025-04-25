import { useRef } from 'react'
import useSWR from 'swr'

import { useAssets } from '@/context/assetsContext'

import useWallet from '../useWallet'
import { getWeightedPoolData } from '../weightedPool/useWeigtedPool'

const getWeightedPosition = async ({ positions = [], chainId, account, assets }) =>
  await Promise.all(
    positions.map(async position => {
      const { claimableFee, depositValue } = await getWeightedPoolData({
        pool: position,
        chainId,
        account,
        isStaked: position.staked,
        assets,
      })
      return {
        position,
        apr: Number(position.apr.replace('%', '')),
        depositLiquidity: depositValue.depositUsd.toNumber(),
        rewardUsd: Number(claimableFee?.total),
      }
    }),
  )

export const useWeightedPositions = (positions = []) => {
  const { account, chainId } = useWallet()
  const assets = useAssets()
  const prevData = useRef([])
  const {
    data: positionsData,
    isLoading,
    error,
  } = useSWR(
    positions.length > 0 && ['get weighted data position', chainId, account, positions],
    () =>
      getWeightedPosition({
        positions,
        assets,
        chainId,
        account,
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
