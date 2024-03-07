import { useMemo } from 'react'
import useSWR from 'swr'

import { useChainSettings } from '@/state/settings/hooks'

import { fetchDerivedPriceData, getTokenBestTvlProtocol } from './fetch'
import { normalizeDerivedChartData, normalizeDerivedPairDataByActiveToken } from './normalizers'

export const useFetchPairPrices = ({ token0Address, token1Address, timeWindow, currentSwapPrice }) => {
  const { networkId } = useChainSettings()
  const { data: protocol0 } = useSWR(
    Boolean(token0Address && networkId) && ['protocol', token0Address, networkId],
    async () => {
      if (!networkId) return undefined
      return getTokenBestTvlProtocol(token0Address, networkId)
    },
  )
  const { data: protocol1 } = useSWR(
    Boolean(token1Address && networkId) && ['protocol', token1Address, networkId],
    async () => {
      if (!networkId) return undefined
      return getTokenBestTvlProtocol(token1Address, networkId)
    },
  )

  const {
    data: normalizedDerivedPairData,
    error,
    isLoading,
  } = useSWR(
    Boolean(protocol0 && protocol1 && token0Address && networkId && token1Address) && [
      'derivedPrice',
      { token0Address, token1Address, networkId, protocol0, protocol1, timeWindow },
    ],
    async () => {
      if (!networkId) return undefined
      const data = await fetchDerivedPriceData(
        token0Address,
        token1Address,
        timeWindow,
        protocol0 ?? 'fusion',
        protocol1 ?? 'fusion',
        networkId,
      )
      return normalizeDerivedPairDataByActiveToken({
        activeToken: token0Address,
        pairData: normalizeDerivedChartData(data),
      })
    },
  )

  const hasSwapPrice = currentSwapPrice && currentSwapPrice[token0Address] > 0
  const normalizedDerivedPairDataWithCurrentSwapPrice = useMemo(
    () =>
      normalizedDerivedPairData && normalizedDerivedPairData?.length > 0 && hasSwapPrice
        ? [...normalizedDerivedPairData, { time: new Date(), value: currentSwapPrice[token0Address] }]
        : normalizedDerivedPairData,
    [currentSwapPrice, hasSwapPrice, normalizedDerivedPairData, token0Address],
  )

  return {
    data: normalizedDerivedPairDataWithCurrentSwapPrice,
    error,
    isLoading,
  }
}
