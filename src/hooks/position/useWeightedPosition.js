import { useMemo, useRef } from 'react'
import useSWR from 'swr'

import { useAssets } from '@/context/assetsContext'

import useWallet from '../useWallet'
import { getWeightedPoolData } from '../weightedPool/useWeigtedPool'

export const useWeightedPositions = (positions = []) => {
  const { account, chainId } = useWallet()
  const assets = useAssets()
  const prevData = useRef([])
  const {
    data: positionsData,
    isLoading,
    error,
  } = useSWR(
    positions.length > 0 && ['get weighted data position', chainId, account, assets, positions],
    () =>
      getWeightedPoolData({
        pools: positions,
        assets,
        chainId,
        account,
      }),
    {
      refreshInterval: 60000,
    },
  )

  const _positionData = useMemo(() => {
    if ((!positionsData || isLoading || error) && positions.length > 0) {
      return prevData.current || []
    }

    prevData.current = positionsData
    return positionsData || []
  }, [error, isLoading, positions.length, positionsData])

  if (!positions || positions.length === 0) return []

  return _positionData
}
