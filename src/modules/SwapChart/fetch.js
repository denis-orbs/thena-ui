import dayjs from 'dayjs'
import request from 'graphql-request'
import { ChainId } from 'thena-sdk-core'

import { FUSION_MULTI_CHAIN_START_TIME } from '@/constant'
import { codexClient, fusionGraphUrl, v1GraphUrl } from '@/lib/graphql'

import { getAdvanceChartDataCodexQuery, getSimpleChartDataCodexQuery, getTVL } from './queries'
import { NUMBER_CHART_DATA } from './utils'

const PROTOCOL = ['v1', 'fusion']

const SWAP_INFO_BY_CHAIN = {
  [ChainId.BSC]: {
    v1: v1GraphUrl[ChainId.BSC],
    fusion: fusionGraphUrl[ChainId.BSC],
  },
  [ChainId.OPBNB]: {
    v1: v1GraphUrl[ChainId.OPBNB],
    fusion: fusionGraphUrl[ChainId.OPBNB],
  },
}

export const PairDataTimeWindow = {
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
  YEAR: 'YEAR',
}

// interval in minutes
export const ChartTimeInterval = {
  MIN_30: 30,
  HOUR_1: 60,
  HOUR_4: 240,
  HOUR_12: 720,
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

const getInterval = timeWindow => {
  switch (timeWindow) {
    case PairDataTimeWindow.DAY:
      return '60'
    case PairDataTimeWindow.WEEK:
      return '240'
    case PairDataTimeWindow.MONTH:
      return '1D'
    case PairDataTimeWindow.YEAR:
      return '7D'
    default:
      return '240'
  }
}

const getSimpleTokenDerivedUSDCPrices = async (
  tokenAddress,
  networkId,
  timeWindow,
  startTimestampUnix,
  endTimestampUnix,
) => {
  try {
    const interval = getInterval(timeWindow)

    const { getBars } = await codexClient.request(
      getSimpleChartDataCodexQuery(tokenAddress, networkId, interval, startTimestampUnix, endTimestampUnix),
      null,
      {
        'Content-Type': 'application/json',
        Authorization: process.env.NEXT_PUBLIC_CODEX_API_KEY,
      },
    )
    let bars

    if (getBars?.o && Array.isArray(getBars?.o)) {
      bars = getBars.o.map((o, index) => ({
        derivedUSD: o,
        timestamp: getBars?.t?.[index],
        tokenAddress,
      }))

      bars.pop()
      return bars
    }
    return []
  } catch (error) {
    console.log({ error })
    return {}
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
    const { getBars } = await codexClient.request(
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
export const fetchSimpleDerivedPriceData = async (
  token0Address,
  token1Address,
  timeWindow,
  protocol0,
  protocol1,
  chainId,
) => {
  const endTimestamp = dayjs()
  const endTimestampUnix = endTimestamp.unix()
  const startTimestampUnix = Math.max(
    endTimestamp.subtract(getSkipDaysToStart(timeWindow), 'days').startOf('hour').unix(),
    FUSION_MULTI_CHAIN_START_TIME[chainId],
  )

  const [token0DerivedUSD, token1DerivedUSD] = await Promise.all([
    getSimpleTokenDerivedUSDCPrices(token0Address, chainId, timeWindow, startTimestampUnix, endTimestampUnix),
    getSimpleTokenDerivedUSDCPrices(token1Address, chainId, timeWindow, startTimestampUnix, endTimestampUnix),
  ])
  return { token0DerivedUSD, token1DerivedUSD }
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
  // console.log({ from: dayjs.unix(from).format('YYYY-MM-DD HH:mm'), to: dayjs.unix(to).format('YYYY-MM-DD HH:mm') })

  return await getAdvancedTokenDerivedUSDCPrices(token0Address, chainId, timeInterval, from, to)
}
