import dayjs from 'dayjs'
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

      const pairData = normalizeSimpleDerivedChartData(data)
      const historyData = normalizeSimpleDerivedPairDataByActiveToken({
        activeToken: token1Address,
        pairData,
      })

      const token0 = data.currentPrices?.[0]
      const token1 = data.currentPrices?.[1]
      const currentTime = dayjs.unix(token0?.timestamp ?? 0)
      const isCurrentTimeAfterLastElementTime = currentTime.isAfter(dayjs.unix(pairData?.at(-1)?.time ?? 0))

      if (token0 && token1 && isCurrentTimeAfterLastElementTime) {
        historyData.push({
          time: currentTime.toDate(),
          value: Number(token1.priceUsd ?? 0) / Number(token0.priceUsd ?? 1),
        })
      }

      return historyData
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

export const fetchAdvancedPairPrices = async (tokenAddress, networkId, toTimeStamp, timeInterval) => {
  if (!tokenAddress || !networkId || !timeInterval) return []
  try {
    return await fetchAdvancedDerivedPriceData(tokenAddress, networkId, toTimeStamp, timeInterval)
  } catch (e) {
    console.log({ error: e })
    return { error: e }
  }
}
