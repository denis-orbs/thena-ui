'use client'

import { gql } from 'graphql-request'
import useSWR from 'swr'

import BarChart from '@/components/charts/BarChart'
import HoverableChart from '@/components/charts/HoverableChart'
import LineChart from '@/components/charts/LineChart'
import { FUSION_MULTI_CHAIN_START_TIME, MANUAL_TYPES, PAIR_TYPES, V1_MULTI_CHAIN_START_TIME } from '@/constant'
import { fetchChartData } from '@/hooks/useGraph'
import { fusionClient, v1Client, weightedClient } from '@/lib/graphql'
import { useChainSettings } from '@/state/settings/hooks'

const V1_DAY_DATAS = gql`
  query v1PairCharts($address: String!, $startTime: Int!, $skip: Int!) {
    pairDayDatas(
      first: 1000
      skip: $skip
      where: { pairAddress: $address, date_gte: $startTime }
      orderBy: date
      orderDirection: asc
    ) {
      date
      dailyVolumeUSD
      reserveUSD
    }
  }
`

const FUSION_DAY_DATAS = gql`
  query fusionPairCharts($address: String!, $startTime: Int!, $skip: Int!) {
    poolDayDatas(
      first: 1000
      skip: $skip
      where: { pool: $address, date_gte: $startTime }
      orderBy: date
      orderDirection: asc
    ) {
      date
      feesUSD
      volumeUSD
      untrackedVolumeUSD
      tvlUSD
    }
  }
`

const WEIGHTED_DAY_DATA = gql`
  query weightedPairCharts($address: String!) {
    poolSnapshots(first: 1000, where: { pool_: { address: $address } }) {
      timestamp
      swapsCount
      swapVolume
      swapFees
      liquidity
      amounts
    }
  }
`

export const getV1ChartData = async (chainId, address, fee, skip) => {
  try {
    const { pairDayDatas } = await v1Client[chainId].request(V1_DAY_DATAS, {
      address,
      startTime: V1_MULTI_CHAIN_START_TIME[chainId],
      skip,
    })
    const data = pairDayDatas.map(ele => ({
      date: ele.date,
      tvlUSD: parseFloat(ele.reserveUSD),
      dayVolume: parseFloat(ele.dailyVolumeUSD),
      dayFees: (parseFloat(ele.dailyVolumeUSD) * fee) / 100,
    }))
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch v1 pair chart data', error)
    return { error: true }
  }
}

export const getFusionChartData = async ({ chainId, address, version = 2, skip = 0 }) => {
  try {
    const { poolDayDatas } = await fusionClient[version][chainId].request(FUSION_DAY_DATAS, {
      address,
      startTime: FUSION_MULTI_CHAIN_START_TIME[chainId],
      skip,
    })
    const data = poolDayDatas.map(ele => ({
      date: ele.date,
      dayVolume: parseFloat(ele.volumeUSD) || parseFloat(ele.untrackedVolumeUSD),
      tvlUSD: parseFloat(ele.tvlUSD),
      dayFees: parseFloat(ele.feesUSD),
    }))
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch fusion pair chart data', error)
    return { error: true }
  }
}

export const getWeightedChartData = async (chainId, address, skip) => {
  try {
    const { poolSnapshots } = await weightedClient[chainId].request(WEIGHTED_DAY_DATA, {
      address,
      skip,
    })

    const data = poolSnapshots?.map(ele => ({
      date: ele.timestamp,
      dayVolume: Number(ele.swapVolume),
      tvlUSD: Number(ele.liquidity),
      dayFees: Number(ele.swapFees),
    }))

    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch fusion pair chart data', error)
    return { data: [], error: true }
  }
}

export const fetchPairChartData = async (chainId, pair) => {
  if (pair.type === PAIR_TYPES.WEIGHTED) {
    const { data: fusiondata = [] } = await fetchChartData(getWeightedChartData, [chainId, pair.address], false)
    return fusiondata
  }

  if (pair.type === PAIR_TYPES.LSD) {
    const version = pair?.version
    const { data: fusionData } = await fetchChartData(
      getFusionChartData,
      [{ chainId, address: pair?.address, version }],
      false,
    )
    if (!pair?.version === 3) return fusionData

    const swapFeePool = pair.subpools.find(ele => ele.title === MANUAL_TYPES[1])
    if (!swapFeePool) return fusionData

    const { data: fusionDataV2 = [] } = await fetchChartData(
      getFusionChartData,
      [{ chainId, address: pair.address, version: 2 }],
      false,
    )
    const { data: fusionFeeData = [] } = await fetchChartData(
      getFusionChartData,
      [{ chainId, address: swapFeePool.address, version }],
      false,
    )

    const mergedData = []
    const allDates = new Set([
      ...fusionData.map(d => d.date),
      ...fusionFeeData.map(d => d.date),
      ...fusionDataV2.map(d => d.date),
    ])

    allDates.forEach(date => {
      const data1 = fusionData.find(d => d.date === date)
      const data2 = fusionFeeData.find(d => d.date === date)
      const data3 = fusionDataV2.find(d => d.date === date)

      mergedData.push({
        date,
        dayFees: (data1?.dayFees ?? 0) + (data2?.dayFees ?? 0) + (data3?.dayFees ?? 0),
        dayVolume: (data1?.dayVolume ?? 0) + (data2?.dayVolume ?? 0) + (data3?.dayVolume ?? 0),
        tvlUSD: (data1?.tvlUSD ?? 0) + (data2?.tvlUSD ?? 0) + (data3?.tvlUSD ?? 0),
      })
    })

    return mergedData
  }

  const { data: v1data } = await fetchChartData(getV1ChartData, [chainId, pair.address, pair.fee], false)
  return v1data
}

export default function PairChart({ pair }) {
  const { networkId } = useChainSettings()
  const { data: chartData } = useSWR(
    pair && ['analytics/pair/chart', pair.address],
    () => fetchPairChartData(networkId, pair),
    {
      refreshInterval: 0,
    },
  )
  return (
    <div className='flex flex-col gap-6'>
      <HoverableChart
        chartData={chartData}
        protocolData={pair}
        valueProperty='tvlUSD'
        title='TVL'
        ChartComponent={LineChart}
      />
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <HoverableChart
          chartData={chartData ? chartData.slice(0, chartData.length - 1) : undefined}
          protocolData={pair}
          valueProperty='dayVolume'
          title='Volume (24h)'
          ChartComponent={BarChart}
        />
        <HoverableChart
          chartData={chartData ? chartData.slice(0, chartData.length - 1) : undefined}
          protocolData={pair}
          valueProperty='dayFees'
          title='Fees (24h)'
          ChartComponent={BarChart}
        />
      </div>
    </div>
  )
}
