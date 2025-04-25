import { useMemo, useRef } from 'react'
import useSWR from 'swr'

import { useAssets } from '@/context/assetsContext'

import useWallet from '../useWallet'
import { getWeightedPoolData } from '../weightedPool/useWeigtedPool'

export const useWeightedPositions = (positions = []) => {
  const { account, chainId } = useWallet()
  const assets = useAssets()
  const prevData = useRef([])
  console.log({ positions })
  const {
    data: positionsData,
    isLoading,
    error,
  } = useSWR(
    positions.length > 0 && ['get weighted data position', chainId, account, positions],
    () =>
      getWeightedPoolData({
        pools: positions,
        assets,
        chainId,
        account,
      }),
    {
      refreshInterval: 0,
    },
  )

  const _positionData = useMemo(() => {
    if (!positionsData || isLoading || error) {
      return prevData.current
    }

    prevData.current = positionsData
    return positionsData
  }, [error, isLoading, positionsData])

  return _positionData
}
