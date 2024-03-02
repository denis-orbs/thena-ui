import dayjs from 'dayjs'
import request from 'graphql-request'
import mapValues from 'lodash/mapValues'
import orderBy from 'lodash/orderBy'
import { ChainId } from 'thena-sdk-core'

import { FUSION_MULTI_CHAIN_START_TIME } from '@/constant'
import { fusionGraphUrl, v1GraphUrl } from '@/lib/graphql'
import { getBlocksFromTimestamps, multiQuery } from '@/lib/subgraph'

import { getDerivedPrices, getDerivedPricesQueryConstructor, getTVL } from './queries'

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

const getTokenDerivedUSDCPrices = async (tokenAddress, blocks, endpoint, isFusion, chainId) => {
  const rawPrices = await multiQuery(
    getDerivedPricesQueryConstructor,
    getDerivedPrices(tokenAddress, blocks, isFusion, chainId),
    endpoint,
    200,
  )

  if (!rawPrices) {
    console.error('Price data failed to load')
    return null
  }

  const prices = mapValues(rawPrices, value => value.derivedUSD)

  // format token BNB price results
  const tokenPrices = []

  // Get Token prices in BNB
  Object.keys(prices).forEach(priceKey => {
    const timestamp = priceKey.split('t')[1]
    if (timestamp) {
      tokenPrices.push({
        tokenAddress,
        timestamp,
        derivedUSD: prices[priceKey] ? parseFloat(prices[priceKey]) : 0,
      })
    }
  })

  return orderBy(tokenPrices, tokenPrice => parseInt(tokenPrice.timestamp, 10))
}

const getInterval = timeWindow => {
  switch (timeWindow) {
    case PairDataTimeWindow.DAY:
      return 3600
    case PairDataTimeWindow.WEEK:
      return 3600 * 4
    case PairDataTimeWindow.MONTH:
      return 3600 * 24
    case PairDataTimeWindow.YEAR:
      return 3600 * 24 * 15
    default:
      return 3600 * 4
  }
}

const getSkipDaysToStart = timeWindow => {
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
export const fetchDerivedPriceData = async (
  token0Address,
  token1Address,
  timeWindow,
  protocol0,
  protocol1,
  chainId,
) => {
  const interval = getInterval(timeWindow)
  const endTimestamp = dayjs()
  const endTimestampUnix = endTimestamp.unix()
  const startTimestamp = Math.max(
    endTimestamp.subtract(getSkipDaysToStart(timeWindow), 'days').startOf('hour').unix(),
    FUSION_MULTI_CHAIN_START_TIME[chainId],
  )
  const timestamps = []
  let time = startTimestamp
  if (!SWAP_INFO_BY_CHAIN[chainId][protocol0] || !SWAP_INFO_BY_CHAIN[chainId][protocol1]) {
    return null
  }
  while (time <= endTimestampUnix) {
    timestamps.push(time)
    time += interval
  }

  const blocks = await getBlocksFromTimestamps(timestamps, 'asc', 500, chainId)
  if (!blocks || blocks.length === 0) {
    console.error('Error fetching blocks for timestamps', timestamps)
    return null
  }
  blocks.pop() // the bsc graph is 32 block behind so pop the last
  const [token0DerivedUSD, token1DerivedUSD] = await Promise.all([
    getTokenDerivedUSDCPrices(
      token0Address,
      blocks,
      SWAP_INFO_BY_CHAIN[chainId][protocol0],
      protocol0 === PROTOCOL[1],
      chainId,
    ),
    getTokenDerivedUSDCPrices(
      token1Address,
      blocks,
      SWAP_INFO_BY_CHAIN[chainId][protocol1],
      protocol1 === PROTOCOL[1],
      chainId,
    ),
  ])
  return { token0DerivedUSD, token1DerivedUSD }
}
