import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import { fromPairs, sumBy } from 'lodash'
import useSWR from 'swr'

import {
  FUSION_MULTI_CHAIN_START_TIME,
  ONE_DAY_UNIX,
  V1_MULTI_CHAIN_START_TIME,
  WEIGHTED_MULTI_CHAIN_START_TIME,
} from '@/constant'
import { getAnalyticsData } from '@/lib/api'
import { fusionClient, v1Client, weightedClient } from '@/lib/graphql'
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
    fusionDayDatas(first: 1000, skip: $skip, where: { date_gte: $startTime }, orderBy: date, orderDirection: asc) {
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

/**
 * Fetches and processes fusion overview chart data for a specific chain.
 * @returns {Promise<{ [date: number]: { volumeUSD: number, tvlUSD: number } } | { error: boolean }>}
 */
const getFusionOverviewChartData = async (params, skip) => {
  try {
    const res = await fusionClient[params.version][params.chainId].request(FUSION_DAY_DATAS, {
      startTime: FUSION_MULTI_CHAIN_START_TIME[params.chainId],
      skip,
    })
    const result = res.fusionDayDatas
    const data = result.map(ele => ({
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

const WEIGHTED_DAY_DATAS = gql`
  query overviewCharts($startTime: Int!, $skip: Int!) {
    balancerSnapshots(
      first: 1000
      skip: $skip
      where: { timestamp_gte: $startTime }
      orderBy: timestamp
      orderDirection: asc
    ) {
      timestamp
      totalLiquidity
      totalSwapVolume
    }
  }
`
/**
 * Fetches and processes fusion overview chart data for a specific chain.
 * @returns {Promise<{ [date: number]: { volumeUSD: number, tvlUSD: number } } | { error: boolean }>}
 */
const getWeightedOverviewChartData = async (chainId, skip) => {
  try {
    const { balancerSnapshots } = await weightedClient[chainId].request(WEIGHTED_DAY_DATAS, {
      startTime: WEIGHTED_MULTI_CHAIN_START_TIME[chainId],
      skip,
    })

    const data = balancerSnapshots.map(ele => ({
      date: ele.date,
      volumeUSD: parseFloat(ele.totalSwapVolume),
      tvlUSD: parseFloat(ele.totalLiquidity),
    }))

    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch overview chart data', error)
    return { error: true }
  }
}

const fetchGlobalChartData = async chainId => {
  const [{ data: v1data }, { data: fusiondata2 }, { data: fusiondata3 }, { data: weightedData }] = await Promise.all([
    fetchChartData(getV1OverviewChartData, [chainId], false),
    fetchChartData(getFusionOverviewChartData, [{ chainId, version: 2 }], true),
    fetchChartData(getFusionOverviewChartData, [{ chainId, version: 3 }], true),
    fetchChartData(getWeightedOverviewChartData, [chainId], true),
  ])

  // console.log({ v1data, fusiondata2, fusiondata3, weightedData })

  return v1data.map(ele => {
    const foundV2 = fusiondata2.find(fusion => fusion.date === ele.date)
    const foundV3 = fusiondata3.find(fusion => fusion.date === ele.date)
    const foundWeighted = weightedData.find(weighted => weighted.date === ele.date)
    return {
      ...ele,
      volumeUSD:
        ele.volumeUSD + (foundV2?.volumeUSD ?? 0) + (foundV3?.volumeUSD ?? 0) + (foundWeighted?.volumeUSD ?? 0),
      tvlUSD: ele.tvlUSD + (foundV2?.tvlUSD ?? 0) + (foundV3?.tvlUSD ?? 0) + (foundWeighted?.tvlUSD ?? 0),
    }
  })
}

export const useGlobalChartData = () => {
  const { networkId } = useChainSettings()
  const { data: chartData } = useSWR(['analytics/global', networkId], () => fetchGlobalChartData(networkId), {
    refreshInterval: 0,
  })
  return chartData ?? undefined
}

const fetchAnalyticsChartData = async networkId => {
  const result = []
  const PAGE_SIZE = 1000
  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      const data = await getAnalyticsData({
        networkId,
        first: PAGE_SIZE,
        page,
      })

      result.push(
        ...data.map(item => ({
          ...item,
          veTheUSD: item.feesUSD * 0.9,
          theNftUSD: item.feesUSD * 0.1,
        })),
      )
      if (data.length < PAGE_SIZE) {
        hasMore = false
      } else {
        page += 1
      }
    } catch (e) {
      console.error('Error fetching userRewards:', e)
      hasMore = false
    }
  }
  return result
}

export const useAnalyticsChartData = () => {
  const { networkId } = useChainSettings()
  const { data: chartData, isLoading } = useSWR(
    ['analytics/all', networkId],
    () => fetchAnalyticsChartData(networkId),
    {
      refreshInterval: 0,
    },
  )
  return { chartData: chartData ?? undefined, isLoading }
}

const fetchEpochFeesData = async (networkId, epoch) => {
  const result = []
  const PAGE_SIZE = 1000
  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      const data = await getAnalyticsData({
        networkId,
        epoch,
        first: PAGE_SIZE,
        page,
      })

      result.push(
        ...data.map(item => ({
          ...item,
          veTheUSD: item.feesUSD * 0.9,
          theNftUSD: item.feesUSD * 0.1,
        })),
      )
      if (data.length < PAGE_SIZE) {
        hasMore = false
      } else {
        page += 1
      }
    } catch (e) {
      console.error('Error fetching userRewards:', e)
      hasMore = false
    }
  }
  return result
}

export const useCurrentEpochFees = () => {
  const { networkId } = useChainSettings()
  const curTime = new Date().getTime() / 1000
  const epoch5 = 1675900800
  const epoch = Math.floor((curTime - epoch5) / 604800) + 5
  const { data } = useSWR(['fees/current-epoch', epoch, networkId], () => fetchEpochFeesData(networkId, epoch), {
    refreshInterval: 0,
  })
  const veTheUSD = sumBy(data, 'veTheUSD')
  const bribeUSD = data?.[0]?.bribeUSD ?? 0

  return veTheUSD + bribeUSD
}
