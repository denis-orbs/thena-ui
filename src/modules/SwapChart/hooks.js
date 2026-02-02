import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import useSWR from 'swr'

import { useChainSettings } from '@/state/settings/hooks'

import { fetchAdvancedDerivedPriceData, fetchSimpleDerivedPriceData, getTokenBestTvlProtocol } from './fetch'
import { normalizeSimpleDerivedChartData, normalizeSimpleDerivedPairDataByActiveToken } from './normalizers'

const getSimpleDeriveData = async ({ token0Address, token1Address, networkId, timeWindow }) => {
  if (!networkId) return undefined
  const data = await fetchSimpleDerivedPriceData({ token0Address, token1Address, timeWindow, networkId })
  const pairData = normalizeSimpleDerivedChartData(data, timeWindow)
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

  return historyData || []
}

export const useFetchPairPrices = ({ token0Address, token1Address, timeWindow, currentSwapPrice }) => {
  const { networkId } = useChainSettings()
  const {
    data: normalizedDerivedPairData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['simple derivedPrice', token0Address, token1Address, networkId, timeWindow],
    queryFn: async () => getSimpleDeriveData({ token0Address, token1Address, networkId, timeWindow }),
    refetchInterval: 1000 * 60, // 1 minute
    enabled: Boolean(token0Address && networkId && token1Address),
  })

  const hasSwapPrice = currentSwapPrice && currentSwapPrice[token0Address] > 0
  const normalizedDerivedPairDataWithCurrentSwapPrice = useMemo(
    () =>
      normalizedDerivedPairData && normalizedDerivedPairData?.length > 0 && hasSwapPrice
        ? [...normalizedDerivedPairData, { time: new Date(), value: currentSwapPrice[token0Address] }]
        : normalizedDerivedPairData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(currentSwapPrice), hasSwapPrice, normalizedDerivedPairData, token0Address],
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
