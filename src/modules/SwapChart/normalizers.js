import dayjs from 'dayjs'
import fromPairs from 'lodash/fromPairs'

import { CHART_CONFIG, OHLCV_TIMEFRAME_MAP } from './constants'

/**
 * Round timestamp by period based on CoinGecko granularity:
 * - 1 day: 5-minutely data (round to nearest 5 minutes)
 * - 2-90 days: hourly data (round to nearest hour)
 * - >90 days: daily data (round to 00:00 UTC)
 */
export const roundTimestampByPeriod = (ts, days) => {
  if (!ts || isNaN(Number(ts))) return ts

  const m = dayjs.unix(ts)

  if (days === 1) {
    // 5-minutely data: round to nearest 5 minutes
    const minutes = m.minute()
    const roundedMinutes = Math.floor(minutes / 5) * 5
    return m.minute(roundedMinutes).second(0).millisecond(0).unix()
  }
  if (days >= 2 && days <= 90) {
    // Hourly data: round to nearest hour
    return m.startOf('hour').unix()
  }
  if (days > 90) {
    // Daily data: round to 00:00 UTC
    return m.utc().startOf('day').unix()
  }

  // Default: round to hour
  return m.startOf('hour').unix()
}

const periodToSeconds = (timeframe, aggregate) => {
  const aggregateNum = Number(aggregate) || 1
  if (timeframe === 'minute') return aggregateNum * 60
  if (timeframe === 'hour') return aggregateNum * 60 * 60
  if (timeframe === 'day') return aggregateNum * 24 * 60 * 60
  return 60 * 60 // default to hour
}

const findNearestEntryByTimestamp = (tokenArr, ts) => {
  if (!tokenArr || tokenArr.length === 0) return null

  // Find the most recent entry before or at the timestamp (previous point)
  let previousEntry = null
  let maxTs = -Infinity

  for (const entry of tokenArr) {
    const entryTs = Number(entry.timestamp)
    if (entryTs <= ts && entryTs > maxTs) {
      maxTs = entryTs
      previousEntry = entry
    }
  }

  // If no previous entry found, use the earliest entry
  if (!previousEntry && tokenArr.length > 0) {
    return tokenArr.reduce((earliest, entry) => {
      const entryTs = Number(entry.timestamp || entry.time)
      const earliestTs = Number(earliest.timestamp || earliest.time)
      return entryTs < earliestTs ? entry : earliest
    })
  }

  return previousEntry
}

export const normalizeSimpleDerivedChartData = (data, timeWindow) => {
  if (!timeWindow) {
    throw new Error('timeWindow is required to normalize simple derived chart data')
  }
  if (!data?.token0DerivedUSD || data?.token0DerivedUSD.length === 0) {
    return []
  }

  // Generate complete time map based on timeWindow configuration
  const config = OHLCV_TIMEFRAME_MAP[timeWindow]
  if (!config) {
    return []
  }

  const { limit: span, timeframe, aggregate } = config
  const periodSeconds = periodToSeconds(timeframe, aggregate)
  const days = CHART_CONFIG[timeWindow] || 1

  const endTimestampUnix = dayjs().unix()
  const roundedEndTs = roundTimestampByPeriod(endTimestampUnix, days)

  const token0Map = fromPairs(data?.token0DerivedUSD?.map(entry => [entry.timestamp, entry]) ?? [])
  const token1Map = fromPairs(data?.token1DerivedUSD?.map(entry => [entry.timestamp, entry]) ?? [])

  const token0Arr = data?.token0DerivedUSD || []
  const token1Arr = data?.token1DerivedUSD || []

  const normalizedData = []
  for (let i = 0; i < span; i++) {
    const ts = roundedEndTs - i * periodSeconds

    let token0Entry = token0Map[ts.toString()]
    let token1Entry = token1Map[ts.toString()]

    if (!token0Entry) {
      token0Entry = findNearestEntryByTimestamp(token0Arr, ts)
    }
    if (!token1Entry) {
      token1Entry = findNearestEntryByTimestamp(token1Arr, ts)
    }

    if (token0Entry && token1Entry && token1Entry.derivedUSD > 0) {
      normalizedData.push({
        time: ts,
        timestamp: ts.toString(),
        token0Id: token0Entry.tokenAddress,
        token1Id: token1Entry.tokenAddress,
        token0DerivedUSD: token0Entry.derivedUSD,
        token1DerivedUSD: token1Entry.derivedUSD,
      })
    }
  }

  return normalizedData.sort((a, b) => a.time - b.time)
}

export const normalizeSimpleDerivedPairDataByActiveToken = ({ pairData, activeToken }) =>
  pairData?.map(pairPrice => ({
    time: dayjs.unix(pairPrice.time).toDate(),
    value:
      activeToken === pairPrice?.token0Id
        ? pairPrice.token1DerivedUSD
          ? pairPrice.token0DerivedUSD / pairPrice.token1DerivedUSD
          : 0
        : pairPrice.token0DerivedUSD
          ? pairPrice.token1DerivedUSD / pairPrice.token0DerivedUSD
          : 0,
  }))
