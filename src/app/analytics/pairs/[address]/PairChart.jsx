'use client'

import { gql } from 'graphql-request'
import useSWRImmutable from 'swr/immutable'

import BarChart from '@/components/charts/BarChart'
import HoverableChart from '@/components/charts/HoverableChart'
import LineChart from '@/components/charts/LineChart'
import { FUSION_MULTI_CHAIN_START_TIME, V1_MULTI_CHAIN_START_TIME } from '@/constant'
import { fetchChartData } from '@/hooks/useGraph'
import { fusionClient, v1Client } from '@/lib/graphql'
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
      tvlUSD
    }
  }
`

const getV1ChartData = async (chainId, address, fee, skip) => {
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

const getFusionChartData = async (chainId, address, skip) => {
  try {
    const { poolDayDatas } = await fusionClient[chainId].request(FUSION_DAY_DATAS, {
      address,
      startTime: FUSION_MULTI_CHAIN_START_TIME[chainId],
      skip,
    })
    const data = poolDayDatas.map(ele => ({
      date: ele.date,
      dayVolume: parseFloat(ele.volumeUSD),
      tvlUSD: parseFloat(ele.tvlUSD),
      dayFees: parseFloat(ele.feesUSD),
    }))
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch fusion pair chart data', error)
    return { error: true }
  }
}

const fetchPairChartData = async (chainId, pair) => {
  console.log('fetch pair chart data ======================')
  if (pair.isFusion) {
    const { data: fusiondata } = await fetchChartData(getFusionChartData, [chainId, pair.address], false)
    return fusiondata
  }
  const { data: v1data } = await fetchChartData(getV1ChartData, [chainId, pair.address, pair.fee], false)
  return v1data
}

export default function PairChart({ pair }) {
  const { networkId } = useChainSettings()
  const { data: chartData } = useSWRImmutable(
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
