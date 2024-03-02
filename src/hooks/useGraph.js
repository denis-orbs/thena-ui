import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import { fromPairs } from 'lodash'
import useSWRImmutable from 'swr/immutable'

import { FUSION_MULTI_CHAIN_START_TIME, ONE_DAY_UNIX, V1_MULTI_CHAIN_START_TIME } from '@/constant'
import { fusionClient, v1Client } from '@/lib/graphql'
import { useChainSettings } from '@/state/settings/hooks'

export const fetchChartData = async (getEntityDayDatas, params = [], isFusion = false) => {
  const chainId = params[0]
  let chartEntries = []
  let error = false
  let skip = 0
  let allFound = false

  while (!allFound && !error) {
    // eslint-disable-next-line no-await-in-loop
    const { data, error: fetchError } = await getEntityDayDatas(...params, skip)
    skip += 1000
    allFound = data?.length < 1000 || skip > 2000
    error = fetchError
    if (data) {
      chartEntries = chartEntries.concat(data)
    }
  }

  if (error || chartEntries.length === 0) {
    return {
      error: true,
    }
  }

  const formattedDayDatas = fromPairs(
    chartEntries.map(dayData => {
      // At this stage we track unix day ordinal for each data point to check for empty days later
      const dayOrdinal = parseInt((dayData.date / ONE_DAY_UNIX).toFixed(0), 10)
      return [dayOrdinal, dayData]
    }),
  )

  const availableDays = Object.keys(formattedDayDatas).map(dayOrdinal => parseInt(dayOrdinal, 10))

  const firstAvailableDayData = formattedDayDatas[availableDays[0]]
  // fill in empty days ( there will be no day datas if no trades made that day )
  let timestamp =
    firstAvailableDayData?.date ??
    (isFusion ? FUSION_MULTI_CHAIN_START_TIME[chainId] : V1_MULTI_CHAIN_START_TIME[chainId])
  let latestLiquidityUSD = firstAvailableDayData?.tvlUSD ?? 0
  const endTimestamp = dayjs().unix()
  while (timestamp < endTimestamp - ONE_DAY_UNIX) {
    timestamp += ONE_DAY_UNIX
    const dayOrdinal = parseInt((timestamp / ONE_DAY_UNIX).toFixed(0), 10)
    if (!Object.keys(formattedDayDatas).includes(dayOrdinal.toString())) {
      formattedDayDatas[dayOrdinal] = {
        date: timestamp,
        volumeUSD: 0,
        feesUSD: 0,
        tvlUSD: latestLiquidityUSD,
      }
    } else {
      latestLiquidityUSD = formattedDayDatas[dayOrdinal].tvlUSD
    }
  }

  return {
    data: Object.values(formattedDayDatas),
    error: false,
  }
}

const V1_DAY_DATAS = gql`
  query overviewCharts($startTime: Int!, $skip: Int!) {
    dayDatas(first: 1000, skip: $skip, where: { date_gte: $startTime }, orderBy: date, orderDirection: asc) {
      date
      dailyVolumeUSD
      totalLiquidityUSD
    }
  }
`

const FUSION_DAY_DATAS = gql`
  query overviewCharts($startTime: Int!, $skip: Int!) {
    algebraDayDatas(first: 1000, skip: $skip, where: { date_gte: $startTime }, orderBy: date, orderDirection: asc) {
      date
      volumeUSD
      tvlUSD
    }
  }
`

const getV1OverviewChartData = async (chainId, skip) => {
  try {
    const { dayDatas } = await v1Client[chainId].request(V1_DAY_DATAS, {
      startTime: V1_MULTI_CHAIN_START_TIME[chainId],
      skip,
    })
    const data = dayDatas.map(ele => ({
      date: ele.date,
      volumeUSD: parseFloat(ele.dailyVolumeUSD),
      tvlUSD: parseFloat(ele.totalLiquidityUSD),
    }))
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch overview chart data', error)
    return { error: true }
  }
}

const getFusionOverviewChartData = async (chainId, skip) => {
  try {
    const { algebraDayDatas } = await fusionClient[chainId].request(FUSION_DAY_DATAS, {
      startTime: FUSION_MULTI_CHAIN_START_TIME[chainId],
      skip,
    })
    const data = algebraDayDatas.map(ele => ({
      date: ele.date,
      volumeUSD: parseFloat(ele.volumeUSD),
      tvlUSD: parseFloat(ele.tvlUSD),
    }))
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch overview chart data', error)
    return { error: true }
  }
}

const fetchGlobalChartData = async chainId => {
  console.log('fetch global chart data ======================')
  const [{ data: v1data }, { data: fusiondata }] = await Promise.all([
    fetchChartData(getV1OverviewChartData, [chainId], false),
    fetchChartData(getFusionOverviewChartData, [chainId], true),
  ])
  return v1data.map(ele => {
    const found = fusiondata.find(fusion => fusion.date === ele.date)
    return {
      ...ele,
      volumeUSD: ele.volumeUSD + (found?.volumeUSD ?? 0),
      tvlUSD: ele.tvlUSD + (found?.tvlUSD ?? 0),
    }
  })
}

export const useGlobalChartData = () => {
  const { networkId } = useChainSettings()
  const { data: chartData } = useSWRImmutable(['analytics/global', networkId], () => fetchGlobalChartData(networkId), {
    refreshInterval: 0,
  })
  return chartData ?? undefined
}
