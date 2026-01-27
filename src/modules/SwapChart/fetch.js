import dayjs from 'dayjs'
import request from 'graphql-request'
import { ChainId } from 'thena-sdk-core'

import { FUSION_MULTI_CHAIN_START_TIME } from '@/constant'
import { CodexClient, FusionGraphUrl, SolidlyGraphUrl } from '@/lib/graphql'

import { CHAIN_MAP, CHART_CONFIG, PairDataTimeWindow } from './constants'
import { roundTimestampByPeriod } from './normalizers'
import { getAdvanceChartDataCodexQuery, getCurrentPriceUSDCodexQuery, getTVL } from './queries'
import { NUMBER_CHART_DATA } from './utils'

const PROTOCOL = ['v1', 'fusion']

const SWAP_INFO_BY_CHAIN = {
  [ChainId.BSC]: {
    v1: SolidlyGraphUrl[ChainId.BSC],
    fusion: FusionGraphUrl[ChainId.BSC],
  },
  [ChainId.OPBNB]: {
    v1: SolidlyGraphUrl[ChainId.OPBNB],
    fusion: FusionGraphUrl[ChainId.OPBNB],
  },
}
// interval in minutes
export const ChartTimeInterval = {
  MIN_30: 30,
  HOUR_1: 60,
  HOUR_4: 240,
  HOUR_12: 720,
}

const fetchWithTimeout = async (url, timeout = 15000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

export const getTokenBestTvlProtocol = async (tokenAddress, chainId) => {
  const infos = SWAP_INFO_BY_CHAIN[chainId]
  const [v1, fusion] = await Promise.allSettled([
    request(infos.v1, getTVL(tokenAddress.toLowerCase())),
    request(infos.fusion, getTVL(tokenAddress.toLowerCase(), true)),
  ])

  const results = [v1, fusion]
  let bestProtocol = 'v1'
  let bestTVL = 0
  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled' && result.value && result.value.token) {
      if (+result.value.token.totalValueLocked > bestTVL) {
        bestTVL = +result.value.token.totalValueLocked
        bestProtocol = PROTOCOL[index]
      }
    }
  }

  return bestProtocol
}

const getDerivedPriceFromCoinGecko = async (tokenAddress, chain, days) => {
  const contractAddress = tokenAddress.toLowerCase()

  const params = new URLSearchParams({
    vs_currency: 'usd',
    days,
  })

  const url = `/api/coins/market-chart/${chain}/${contractAddress}?${params.toString()}`

  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  const data = await response.json()

  return data?.prices || []
}

const getSimpleTokenDerivedUSDCPrices = async (
  tokenAddress,
  networkId,
  timeWindow,
  startTimestampUnix,
  endTimestampUnix,
) => {
  try {
    const days = CHART_CONFIG[timeWindow]
    const chain = CHAIN_MAP[networkId]
    const prices = await getDerivedPriceFromCoinGecko(tokenAddress, chain, days)
    if (prices.length > 0) {
      const mappedBars = prices
        .filter(([timestamp]) => {
          const tsSeconds = Math.floor(timestamp / 1000)
          return tsSeconds >= startTimestampUnix && tsSeconds <= endTimestampUnix
        })
        .map(([timestamp, price]) => {
          const tsSeconds = Math.floor(timestamp / 1000)
          const roundedTs = roundTimestampByPeriod(tsSeconds, days)
          return {
            derivedUSD: price,
            timestamp: roundedTs,
            tokenAddress,
          }
        })

      const tsMap = new Map()
      mappedBars.forEach(bar => {
        tsMap.set(bar.timestamp, bar)
      })

      return Array.from(tsMap.values()).sort((a, b) => a.timestamp - b.timestamp)
    }
    return []
  } catch (error) {
    console.error('Error fetching simple token derived USDC prices')
    return []
  }
}

const getTokenPriceFromCoinGecko = async (tokenAddress, networkId) => {
  try {
    const chain = CHAIN_MAP[networkId]
    const params = new URLSearchParams({
      contract_addresses: tokenAddress,
      include_last_updated_at: true,
      vs_currencies: 'usd',
    })
    const url = `/api/coins/current-price/${chain}?${params.toString()}`
    const response = await fetchWithTimeout(url)
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    const data = await response.json()
    return data[tokenAddress.toLowerCase()]
  } catch (error) {
    console.error('Error fetching token price from CoinGecko:', error)
    return {}
  }
}

export const getCurrentprice = async (tokenA, tokenB, networkId) => {
  try {
    const [tokenPriceA, tokenPriceB] = await Promise.all([
      getTokenPriceFromCoinGecko(tokenA, networkId),
      getTokenPriceFromCoinGecko(tokenB, networkId),
    ])

    if (tokenPriceA && tokenPriceB) {
      const { usd: tokenPricesA = {}, last_updated_at: lastTradeTsA = {} } = tokenPriceA
      const { usd: tokenPricesB = {}, last_updated_at: lastTradeTsB = {} } = tokenPriceB
      return [
        { address: tokenA, priceUsd: tokenPricesA, timestamp: lastTradeTsA },
        { address: tokenB, priceUsd: tokenPricesB, timestamp: lastTradeTsB },
      ]
    }

    return []
  } catch (error) {
    console.error('Error fetching current price from CoinGecko:', error)
    return []
  }
}

export const getTokenCurrentUSDPrice = async (token, networkId) => {
  try {
    const { getTokenPrices = [] } = await CodexClient.request(getCurrentPriceUSDCodexQuery(token, networkId), null, {
      'Content-Type': 'application/json',
      Authorization: process.env.NEXT_PUBLIC_CODEX_API_KEY,
    })

    return getTokenPrices?.[0]?.priceUsd ?? 0
  } catch (error) {
    console.log({ error })
    return 0
  }
}

const getAdvancedTokenDerivedUSDCPrices = async (
  tokenAddress,
  networkId,
  timeInterval,
  startTimestampUnix,
  endTimestampUnix,
) => {
  try {
    const { getBars } = await CodexClient.request(
      getAdvanceChartDataCodexQuery(tokenAddress, networkId, timeInterval, startTimestampUnix, endTimestampUnix),
      null,
      {
        'Content-Type': 'application/json',
        Authorization: process.env.NEXT_PUBLIC_CODEX_API_KEY,
      },
    )
    let bars

    if (getBars?.o && Array.isArray(getBars?.o)) {
      bars = getBars.o.map((o, index) => ({
        open: o,
        close: getBars?.c?.[index],
        time: getBars?.t?.[index],
        high: getBars?.h?.[index],
        low: getBars?.l?.[index],
        volume: getBars?.v?.[index],
        tokenAddress,
      }))

      // bars.pop()
      return bars
    }
    return []
  } catch (error) {
    console.log({ error })
    return {}
  }
}

export const getSkipDaysToStart = timeWindow => {
  switch (timeWindow) {
    case PairDataTimeWindow.DAY:
      return 1
    case PairDataTimeWindow.WEEK:
      return 7
    case PairDataTimeWindow.MONTH:
      return 30
    case PairDataTimeWindow.YEAR:
      return 365
    default:
      return 7
  }
}

// Fetches derivedBnb values for tokens to calculate derived price
// Used when no direct pool is available
export const fetchSimpleDerivedPriceData = async (token0Address, token1Address, timeWindow, chainId) => {
  const endTimestamp = dayjs()
  const endTimestampUnix = endTimestamp.unix()

  const startTimestampUnix = Math.max(
    endTimestamp.subtract(getSkipDaysToStart(timeWindow), 'days').startOf('hour').unix(),
    FUSION_MULTI_CHAIN_START_TIME[chainId],
  )

  const [token0DerivedUSD, token1DerivedUSD, currentPrices] = await Promise.all([
    getSimpleTokenDerivedUSDCPrices(token0Address, chainId, timeWindow, startTimestampUnix, endTimestampUnix),
    getSimpleTokenDerivedUSDCPrices(token1Address, chainId, timeWindow, startTimestampUnix, endTimestampUnix),
    getCurrentprice(token0Address, token1Address, chainId),
  ])

  return { token0DerivedUSD, token1DerivedUSD, currentPrices }
}

export const fetchAdvancedDerivedPriceData = async (token0Address, chainId, toTimeStamp, timeInterval) => {
  const from = Math.max(
    dayjs
      .unix(toTimeStamp)
      .subtract(Number(timeInterval) * NUMBER_CHART_DATA, 'minutes')
      .startOf('minutes')
      .unix(),
    FUSION_MULTI_CHAIN_START_TIME[chainId],
  )
  const to = dayjs.unix(toTimeStamp).startOf('minutes').unix()
  return await getAdvancedTokenDerivedUSDCPrices(token0Address, chainId, timeInterval, from, to)
}
