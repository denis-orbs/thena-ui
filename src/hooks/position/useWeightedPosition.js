import { useMemo } from 'react'

import { useAssets } from '@/context/assetsContext'

import { useCachedSWR } from '../useCachedSWR'
import useWallet from '../useWallet'
import { getWeightedPoolData } from '../weightedPool/useWeigtedPool'

export const useWeightedPositions = (positions = []) => {
  const { account, chainId } = useWallet()
  const assets = useAssets()
  const dataKey = useMemo(
    () => (positions.length > 0 ? ['get weighted data position', chainId, account, assets, positions] : null),
    [positions, chainId, account, assets],
  )

  const { data: positionsData } = useCachedSWR(
    dataKey,
    () =>
      getWeightedPoolData({
        pools: positions,
        assets,
        chainId,
        account,
      }),
    { refreshInterval: 60000 },
  )

  return useMemo(() => positionsData || [], [positionsData])
}
