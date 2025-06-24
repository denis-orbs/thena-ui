'use client'

import { gql } from 'graphql-request'
import { useMemo } from 'react'
import useSWR from 'swr'

import BarChart from '@/components/charts/BarChart'
import HoverableChart from '@/components/charts/HoverableChart'
import LineChart from '@/components/charts/LineChart'
import { FUSION_MULTI_CHAIN_START_TIME, ONE_DAY_UNIX, V1_MULTI_CHAIN_START_TIME } from '@/constant'
import { fusionClient, v1Client } from '@/lib/graphql'
import { useChainSettings } from '@/state/settings/hooks'

const V1_DAY_DATAS = gql`
  query v1TokenCharts($address: String!, $startTime: Int!, $skip: Int!) {
    tokenDayDatas(
      first: 1000
      skip: $skip
      where: { token: $address, date_gte: $startTime }
      orderBy: date
      orderDirection: asc
    ) {
      date
      totalLiquidityUSD
      dailyVolumeUSD
      priceUSD
    }
  }
`

const getV1ChartData = async (chainId, address, skip = 0) => {
  try {
    const { tokenDayDatas } = await v1Client[chainId].request(V1_DAY_DATAS, {
      address,
      startTime: V1_MULTI_CHAIN_START_TIME[chainId],
      skip,
    })
    const data = tokenDayDatas.map(ele => ({
      date: Number(ele.date),
      tvlUSD: parseFloat(ele.totalLiquidityUSD),
      dailyVolumeUSD: parseFloat(ele.dailyVolumeUSD),
      priceUSD: parseFloat(ele.priceUSD),
    }))
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch v1 token chart data', error)
    return { error: true }
  }
}

const FUSION_DAY_DATAS = gql`
  query fusionTokenCharts($address: String!, $startTime: Int!, $skip: Int!) {
    tokenDayDatas(
      first: 1000
      skip: $skip
      where: { token: $address, date_gte: $startTime }
      orderBy: date
      orderDirection: asc
    ) {
      date
      totalValueLockedUSD
      volumeUSD
      untrackedVolumeUSD
      priceUSD
    }
  }
`

const getFusionChartData = async (chainId, address, skip = 0, version = null) => {
  try {
    const client = fusionClient[version]?.[chainId] ?? fusionClient[chainId]

    const { tokenDayDatas } = await client.request(FUSION_DAY_DATAS, {
      address,
      startTime: FUSION_MULTI_CHAIN_START_TIME[chainId],
      skip,
    })
    const data = tokenDayDatas.map(ele => ({
      date: Number(ele.date),
      tvlUSD: parseFloat(ele.totalValueLockedUSD),
      dailyVolumeUSD: parseFloat(ele.volumeUSD) || parseFloat(ele.untrackedVolumeUSD),
      priceUSD: parseFloat(ele.priceUSD),
    }))
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch fusion token chart data', error)
    return { error: true }
  }
}

const fetchTokenChartData = async (chainId, token) => {
  console.log('fetch token chart data ======================')
  const { data: fusiondata } = await getFusionChartData(chainId, token.address)
  const { data: fusiondatav3 } = await getFusionChartData(chainId, token.address, 0, 3)
  const { data: v1data } = await getV1ChartData(chainId, token.address)
  const fusionFirstDate = (fusiondata && fusiondata[0]?.date) ?? 0
  const v1FirstDate = (v1data && v1data[0]?.date) ?? 0

  const fusionData = []
  const allDates = new Set([...fusiondata.map(d => d.date), ...fusiondatav3.map(d => d.date)])

  allDates.forEach(date => {
    const data1 = fusiondata.find(d => d.date === date)
    const data2 = fusiondatav3.find(d => d.date === date)

    if (data1 && data2) {
      fusionData.push({
        date,
        tvlUSD: (data1.tvlUSD ?? 0) + (data2.tvlUSD ?? 0),
        dailyVolumeUSD: (data1.dailyVolumeUSD ?? 0) + (data2.dailyVolumeUSD ?? 0),
        priceUSD: data2.priceUSD ?? data1.priceUSD ?? 0,
      })
    } else {
      fusionData.push(data1 || data2)
    }
  })

  const isFusionFirst = !v1FirstDate || (!!fusionFirstDate && fusionFirstDate <= v1FirstDate)
  const firstData = isFusionFirst ? fusionData : v1data
  const secondData = isFusionFirst ? v1data : fusionData

  const minDate = firstData[0]?.date ?? 0
  const maxDate = Math.floor(Date.now() / 1000)

  const mergedData = firstData.map(ele => {
    const found = secondData.find(item => item.date === ele.date)
    return {
      date: ele.date,
      tvlUSD: ele.tvlUSD + (found?.tvlUSD ?? 0),
      dailyVolumeUSD: ele.dailyVolumeUSD + (found?.dailyVolumeUSD ?? 0),
      priceUSD: ele && ele.priceUSD ? ele.priceUSD : found && found.priceUSD ? found.priceUSD : 0,
    }
  })
  const byDate = Object.fromEntries(mergedData.map(d => [d.date, d]))
  if (minDate) {
    const result = []
    let lastTVL = 0
    let lastPrice = 0

    for (let date = minDate; date <= maxDate; date += ONE_DAY_UNIX) {
      const item = byDate[date]
      if (item) {
        lastTVL = item.tvlUSD
        lastPrice = item.priceUSD
        result.push(item)
      } else {
        result.push({
          date,
          tvlUSD: lastTVL,
          dailyVolumeUSD: 0,
          priceUSD: lastPrice,
        })
      }
    }

    return result
  }
  return mergedData
}

export default function TokenChart({ token }) {
  const { networkId } = useChainSettings()
  const { data: chartData } = useSWR(
    token && ['analytics/token/chart', token.address],
    () => fetchTokenChartData(networkId, token),
    {
      refreshInterval: 0,
    },
  )
  const stats = useMemo(
    () => ({
      tvlUSD: token?.liquidity,
      dailyVolumeUSD: token?.volume,
      priceUSD: token?.price,
    }),
    [token],
  )
  return (
    <div className='flex flex-col gap-6'>
      <HoverableChart
        chartData={chartData}
        protocolData={stats}
        valueProperty='tvlUSD'
        title='TVL'
        ChartComponent={LineChart}
      />
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <HoverableChart
          chartData={chartData ? chartData.slice(0, chartData.length - 1) : undefined}
          protocolData={stats}
          valueProperty='dailyVolumeUSD'
          title='Volume (24h)'
          ChartComponent={BarChart}
        />
        <HoverableChart
          chartData={chartData}
          protocolData={stats}
          valueProperty='priceUSD'
          title='Price'
          ChartComponent={LineChart}
        />
      </div>
    </div>
  )
}
