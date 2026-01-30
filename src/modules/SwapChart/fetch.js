import dayjs from 'dayjs'
import request from 'graphql-request'
import { ChainId } from 'thena-sdk-core'

import { fetchTokenChartData } from '@/app/analytics/tokens/[address]/TokenChart'
import { FUSION_MULTI_CHAIN_START_TIME } from '@/constant'
import { CodexClient, FusionGraphUrl, SolidlyGraphUrl } from '@/lib/graphql'

import { CHAIN_MAP, CHART_CONFIG, OHLCV_CHAIN_MAP, OHLCV_TIMEFRAME_MAP, PairDataTimeWindow } from './constants'
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
  { tokenAddress, networkId, timeWindow, startTsUnix, endTsUnix },
  fallbackFns = [],
) => {
  let result = []
  try {
    const days = CHART_CONFIG[timeWindow]
    const chain = CHAIN_MAP[networkId]
    const prices = await getDerivedPriceFromCoinGecko(tokenAddress, chain, days)
    if (prices.length > 0) {
      const mappedBars = prices.map(([timestamp, price]) => {
        const tsSeconds = Math.floor(timestamp / 1000)
        let roundedTs = roundTimestampByPeriod(tsSeconds, days)
        if (roundedTs < startTsUnix) {
          roundedTs = startTsUnix
        }
        if (roundedTs > endTsUnix) {
          roundedTs = endTsUnix
        }
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

      result = Array.from(tsMap.values()).sort((a, b) => a.timestamp - b.timestamp)
    }
  } catch (error) {
    console.error('Error fetching simple token derived USDC prices')
    result = []
  }

  if (result.length === 0) {
    for (const fallbackFn of fallbackFns) {
      try {
        const fallbackResult = await (typeof fallbackFn === 'function' ? fallbackFn() : fallbackFn)
        if (fallbackResult.length > 0) {
          result = fallbackResult
          break
        }
      } catch (error) {
        console.error('Error fetching fallback data:', error)
      }
    }
  }
  return result
}

const normalizeOHLCVData = (data, tokenAddress, startTsUnix, endTsUnix) => {
  const ohlcvData = data?.attributes?.ohlcv_list || []
  const result = ohlcvData
    .map(item => {
      let timestamp = item[0] // get timestamp
      if (timestamp < startTsUnix) {
        timestamp = startTsUnix
      }
      if (timestamp > endTsUnix) {
        timestamp = endTsUnix
      }
      const derivedUSD = item[3] // get close price to derivedUSD (the price of this timestamp)
      return {
        derivedUSD,
        timestamp,
        tokenAddress,
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
  return result
}

const getDataFromThena = async ({ networkId, tokenAddress, startTsUnix, endTsUnix, timeWindow }) => {
  try {
    const response = await fetchTokenChartData(networkId, { address: tokenAddress })
    const { days } = CHART_CONFIG[timeWindow]
    if (!response) {
      return []
    }
    const result = response
      .filter(item => item.date >= startTsUnix && item.date <= endTsUnix)
      .map(item => ({
        derivedUSD: item.priceUSD,
        timestamp: roundTimestampByPeriod(item.date, days),
        tokenAddress,
      }))
    console.trace({ result })
    return result
  } catch (error) {
    console.error('Error fetching data from Thena:', error)
    return []
  }
}

const getOHLCVData = async ({ tokenAddress, networkId, timeWindow, startTsUnix, endTsUnix }) => {
  const { timeframe, aggregate, limit } = OHLCV_TIMEFRAME_MAP[timeWindow]
  const chainIdOHLCV = OHLCV_CHAIN_MAP[networkId]
  const params = new URLSearchParams({
    timeframe,
    aggregate,
    limit,
  })
  const url = `/api/coins/ohlcv-chart/${chainIdOHLCV}/${tokenAddress}?${params.toString()}`
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    return []
  }
  const data = await response.json()
  const rawData = data?.data || null

  return normalizeOHLCVData(rawData, tokenAddress, startTsUnix, endTsUnix)
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
    return undefined
  }
}

export const getCurrentprice = async (tokenA, tokenB, networkId) => {
  try {
    const [tokenPriceA, tokenPriceB] = await Promise.allSettled([
      getTokenPriceFromCoinGecko(tokenA, networkId),
      getTokenPriceFromCoinGecko(tokenB, networkId),
    ])

    const result = []

    if (tokenPriceA.status === 'fulfilled' && tokenPriceA.value) {
      const { usd: tokenPricesA = {}, last_updated_at: lastTradeTsA = {} } = tokenPriceA.value
      result.push({ address: tokenA, priceUsd: tokenPricesA, timestamp: lastTradeTsA })
    }

    if (tokenPriceB.status === 'fulfilled' && tokenPriceB.value) {
      const { usd: tokenPricesB = {}, last_updated_at: lastTradeTsB = {} } = tokenPriceB.value
      result.push({ address: tokenB, priceUsd: tokenPricesB, timestamp: lastTradeTsB })
    }

    return result
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

const getDerivedUSDOrFallback = (derivedUSDResult, currentPrice, tokenAddress, timeWindow) => {
  // If derivedUSD is successful and has items, use it
  if (derivedUSDResult.status === 'fulfilled' && derivedUSDResult.value?.length > 0) {
    return derivedUSDResult.value
  }
  if (currentPrice) {
    console.trace('using fallback price because the data is not available', currentPrice)
    return [
      {
        timestamp: roundTimestampByPeriod(currentPrice.timestamp, CHART_CONFIG[timeWindow]),
        derivedUSD: currentPrice.priceUsd,
        tokenAddress,
      },
    ]
  }
  return []
}

// Fetches derivedBnb values for tokens to calculate derived price
// Used when no direct pool is available
export const fetchSimpleDerivedPriceData = async ({ token0Address, token1Address, timeWindow, networkId }) => {
  const endTimestamp = dayjs()
  const endTsUnix = endTimestamp.unix()

  const startTsUnix = Math.max(
    endTimestamp.subtract(getSkipDaysToStart(timeWindow), 'days').startOf('hour').unix(),
    FUSION_MULTI_CHAIN_START_TIME[networkId],
  )

  const [token0DerivedUSD, token1DerivedUSD, currentPrices] = await Promise.allSettled([
    getSimpleTokenDerivedUSDCPrices({ tokenAddress: token0Address, networkId, timeWindow, startTsUnix, endTsUnix }, [
      () =>
        getOHLCVData({
          tokenAddress: token0Address,
          networkId,
          timeWindow,
          startTsUnix,
          endTsUnix,
        }),
      () =>
        getDataFromThena({
          networkId,
          tokenAddress: token0Address,
          timeWindow,
          startTsUnix,
          endTsUnix,
        }),
    ]),
    getSimpleTokenDerivedUSDCPrices(
      {
        tokenAddress: token1Address,
        networkId,
        timeWindow,
        startTsUnix,
        endTsUnix,
      },
      [
        () =>
          getOHLCVData({
            tokenAddress: token1Address,
            networkId,
            timeWindow,
            startTsUnix,
            endTsUnix,
          }),
        () =>
          getDataFromThena({
            networkId,
            tokenAddress: token1Address,
            timeWindow,
            startTsUnix,
            endTsUnix,
          }),
      ],
    ),
    getCurrentprice(token0Address, token1Address, networkId),
  ])

  const priceData = currentPrices.status === 'fulfilled' ? currentPrices.value : []
  const currentPrice0 = priceData.find(item => item.address.toLowerCase() === token0Address.toLowerCase())
  const currentPrice1 = priceData.find(item => item.address.toLowerCase() === token1Address.toLowerCase())

  return {
    token0DerivedUSD: getDerivedUSDOrFallback(token0DerivedUSD, currentPrice0, token0Address, timeWindow),
    token1DerivedUSD: getDerivedUSDOrFallback(token1DerivedUSD, currentPrice1, token1Address, timeWindow),
    currentPrices: priceData,
  }
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
