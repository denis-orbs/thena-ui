import { useMemo } from 'react'
import useSWR from 'swr'

import { useChainSettings } from '@/state/settings/hooks'

import { fetchAdvancedDerivedPriceData, fetchSimpleDerivedPriceData, getTokenBestTvlProtocol } from './fetch'
import { normalizeSimpleDerivedChartData, normalizeSimpleDerivedPairDataByActiveToken } from './normalizers'

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
      'simple derivedPrice',
      { token0Address, token1Address, networkId, protocol0, protocol1, timeWindow },
    ],
    async () => {
      if (!networkId) return undefined
      const data = await fetchSimpleDerivedPriceData(
        token0Address,
        token1Address,
        timeWindow,
        protocol0 ?? 'fusion',
        protocol1 ?? 'fusion',
        networkId,
      )
      return normalizeSimpleDerivedPairDataByActiveToken({
        activeToken: token1Address,
        pairData: normalizeSimpleDerivedChartData(data),
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

export const useFetchBestTvlProtocol = ({ tokenAddress }) => {
  const { networkId } = useChainSettings()
  const {
    data: protocol,
    error,
    isLoading,
  } = useSWR(Boolean(tokenAddress && networkId) && ['protocol', tokenAddress, networkId], async () => {
    if (!networkId) return undefined
    return getTokenBestTvlProtocol(tokenAddress, networkId)
  })
  return {
    protocol,
    error,
    isLoading,
  }
}

export const useFetchPairTvlProtocol = ({ token0Address, token1Address }) => {
  const { protocol: protocol0, error: error0, isLoading: isLoading0 } = useFetchBestTvlProtocol(token0Address)
  const { protocol: protocol1, error: error1, isLoading: isLoading1 } = useFetchBestTvlProtocol(token1Address)
  return {
    protocol0,
    protocol1,
    error: error0 || error1,
    isLoading: isLoading0 || isLoading1,
  }
}

export const fetchAdvancedPairPrices = async (tokenAddress, networkId, currentTimeStamp, timeInterval) => {
  if (!tokenAddress || !networkId || !timeInterval) return []
  try {
    return await fetchAdvancedDerivedPriceData(tokenAddress, networkId, currentTimeStamp, timeInterval)
  } catch (e) {
    return { error: e }
  }
}
