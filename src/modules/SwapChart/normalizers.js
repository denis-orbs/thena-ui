import dayjs from 'dayjs'
import fromPairs from 'lodash/fromPairs'

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

export const normalizeSimpleDerivedChartData = data => {
  if (!data?.token0DerivedUSD || data?.token0DerivedUSD.length === 0) {
    return []
  }

  const token1DerivedUSDEntryMap = fromPairs(data?.token1DerivedUSD?.map(entry => [entry.timestamp, entry]) ?? [])

  const timeMap = new Map()

  data?.token0DerivedUSD.forEach(token0DerivedUSDEntry => {
    const token1DerivedUSDEntry = token1DerivedUSDEntryMap[token0DerivedUSDEntry.timestamp]
    if (token1DerivedUSDEntry && token1DerivedUSDEntry.derivedUSD > 0) {
      const time = parseInt(token0DerivedUSDEntry.timestamp, 10)
      timeMap.set(time, {
        time,
        token0Id: token0DerivedUSDEntry.tokenAddress,
        token1Id: token1DerivedUSDEntry.tokenAddress,
        token0DerivedUSD: token0DerivedUSDEntry.derivedUSD,
        token1DerivedUSD: token1DerivedUSDEntry.derivedUSD,
      })
    }
  })

  return Array.from(timeMap.values()).sort((a, b) => a.time - b.time)
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
