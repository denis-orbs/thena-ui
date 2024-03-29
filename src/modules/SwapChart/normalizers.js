import dayjs from 'dayjs'
import fromPairs from 'lodash/fromPairs'

export const normalizeDerivedChartData = data => {
  if (!data?.token0DerivedUSD || data?.token0DerivedUSD.length === 0) {
    return []
  }

  const token1DerivedUSDEntryMap = fromPairs(data?.token1DerivedUSD?.map(entry => [entry.timestamp, entry]) ?? [])

  return data?.token0DerivedUSD.reduce((acc, token0DerivedUSDEntry) => {
    const token1DerivedUSDEntry = token1DerivedUSDEntryMap[token0DerivedUSDEntry.timestamp]
    if (token1DerivedUSDEntry && token1DerivedUSDEntry.derivedUSD > 0) {
      acc.push({
        time: parseInt(token0DerivedUSDEntry.timestamp, 10),
        token0Id: token0DerivedUSDEntry.tokenAddress,
        token1Id: token1DerivedUSDEntry.tokenAddress,
        token0DerivedUSD: token0DerivedUSDEntry.derivedUSD,
        token1DerivedUSD: token1DerivedUSDEntry.derivedUSD,
      })
    }
    return acc
  }, [])
}

export const normalizeDerivedPairDataByActiveToken = ({ pairData, activeToken }) =>
  pairData?.map(pairPrice => ({
    time: dayjs.unix(pairPrice.time).toDate(),
    value:
      activeToken === pairPrice?.token0Id
        ? pairPrice.token0DerivedUSD / pairPrice.token1DerivedUSD
        : pairPrice.token1DerivedUSD / pairPrice.token0DerivedUSD,
  }))
