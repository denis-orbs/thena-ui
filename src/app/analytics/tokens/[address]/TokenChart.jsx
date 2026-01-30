'use client'

import { gql } from 'graphql-request'
import { min } from 'lodash'
import { useMemo } from 'react'
import useSWR from 'swr'

import BarChart from '@/components/charts/BarChart'
import HoverableChart from '@/components/charts/HoverableChart'
import LineChart from '@/components/charts/LineChart'
import { FUSION_MULTI_CHAIN_START_TIME, ONE_DAY_UNIX, V1_MULTI_CHAIN_START_TIME } from '@/constant'
import { AlgebraClient, SolidlyClient } from '@/lib/graphql'
import { useChainSettings } from '@/state/settings/hooks'

import { getHistoricalTokenPrice } from '../../pairs/[address]/PairChart'

const dayUTC = ts => Math.floor(ts / ONE_DAY_UNIX) * ONE_DAY_UNIX

function findNearestPrice(priceDataArr, targetDay, priceByDay) {
  const target = dayUTC(targetDay)
  if (priceByDay.has(target)) return priceByDay.get(target).priceUSD

  let before = null
  let after = null
  for (const p of priceDataArr) {
    const day = dayUTC(Number(p.date))
    if (day <= target) {
      if (!before || day > before.date) before = { date: day, priceUSD: p.priceUSD }
    } else if (!after || day < after.date) after = { date: day, priceUSD: p.priceUSD }
  }
  if (before && after) {
    const _before = Math.abs(target - before.date)
    const _after = Math.abs(after.date - target)
    return _before <= _after ? before.priceUSD : after.priceUSD
  }
  if (before) return before.priceUSD
  if (after) return after.priceUSD
  return 0
}

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
      dailyVolumeToken
      priceUSD
      totalLiquidityToken
      totalLiquidityETH
    }
    tokens(where: { id: $address }) {
      derivedETH
    }
  }
`

const getV1ChartData = async (chainId, address, skip = 0) => {
  try {
    const { tokenDayDatas, tokens } = await SolidlyClient[chainId].request(V1_DAY_DATAS, {
      address,
      startTime: V1_MULTI_CHAIN_START_TIME[chainId],
      skip,
    })

    if (tokens.some(token => Number(token.derivedETH ?? 0) === 0)) {
      const priceData = await getHistoricalTokenPrice({
        chainId,
        tokenAddresses: [address],
        startTime: V1_MULTI_CHAIN_START_TIME[chainId],
      })

      const tokenByDay = new Map(tokenDayDatas.map(d => [d.date, d]))
      const priceByDay = new Map(priceData.map(p => [p.date, p]))

      const minDay = Math.min(...[...tokenByDay.keys(), ...priceByDay.keys()].map(Number))
      const maxDay = Math.max(...[...tokenByDay.keys(), ...priceByDay.keys()].map(Number))
      const days = []
      for (let d = minDay; d <= maxDay; d += ONE_DAY_UNIX) days.push(d)

      let lastLiquidityToken = null

      const data = days.map(day => {
        const t = tokenByDay.get(day)
        const priceUSD = parseFloat(findNearestPrice(priceData, day, priceByDay) ?? t?.priceUSD ?? 0)

        if (t && t.totalLiquidityToken != null) {
          lastLiquidityToken = parseFloat(t.totalLiquidityToken)
        }

        const dailyVolumeToken = t ? parseFloat(t.dailyVolumeToken || 0) : 0
        const tvlToken = lastLiquidityToken ?? 0

        const tvlUSDcalc = tvlToken * priceUSD
        const dailyVolumeUSDcalc = dailyVolumeToken * priceUSD

        return {
          date: day,
          tvlUSD: Number.isFinite(tvlUSDcalc) ? tvlUSDcalc : parseFloat(t?.totalLiquidityUSD || 0),
          dailyVolumeUSD: Number.isFinite(dailyVolumeUSDcalc) ? dailyVolumeUSDcalc : parseFloat(t?.dailyVolumeUSD || 0),
          priceUSD: priceUSD || 0,
        }
      })
      return { data, error: false }
    }

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
    const client = AlgebraClient[version]?.[chainId] ?? AlgebraClient[chainId]

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

export const fetchTokenChartData = async (chainId, token) => {
  console.log('fetch token chart data ======================')
  const { data: fusiondata } = await getFusionChartData(chainId, token.address)
  const { data: fusiondatav3 } = await getFusionChartData(chainId, token.address, 0, 3)

  const { data: v1data } = await getV1ChartData(chainId, token.address)
  const fusionFirstDate = (fusiondata && fusiondata[0]?.date) ?? 0
  const v1FirstDate = (v1data && v1data[0]?.date) ?? 0

  const fusionData = []
  const allDates = [...v1data.map(d => d.date), ...fusiondata.map(d => d.date), ...fusiondatav3.map(d => d.date)]

  const isFusionFirst = !v1FirstDate || (!!fusionFirstDate && fusionFirstDate <= v1FirstDate)
  const firstData = isFusionFirst ? fusionData : v1data
  const secondData = isFusionFirst ? v1data : fusionData

  const minDate = allDates.length ? min(allDates) : null
  const maxDate = Math.floor(Date.now() / 1000)

  if (minDate) {
    const result = []
    let lastTVL = 0
    let lastPrice = 0

    for (let date = minDate; date <= maxDate; date += ONE_DAY_UNIX) {
      const data1 = v1data.find(d => d.date === date)
      const fusionItem = fusiondata.find(d => d.date === date)
      const fusionV3Item = fusiondatav3.find(d => d.date === date)

      const item = {
        date,
        tvlUSD:
          !data1 && !fusionItem && !fusionV3Item
            ? lastTVL
            : (data1?.tvlUSD ?? 0) + (fusionItem?.tvlUSD ?? 0) + (fusionV3Item?.tvlUSD ?? 0),
        dailyVolumeUSD:
          (data1?.dailyVolumeUSD ?? 0) + (fusionItem?.dailyVolumeUSD ?? 0) + (fusionV3Item?.dailyVolumeUSD ?? 0),
        priceUSD:
          [fusionV3Item?.priceUSD, fusionItem?.priceUSD, data1?.priceUSD, lastPrice].find(
            v => v && v !== '0' && v !== 0,
          ) ?? 0,
      }
      lastTVL = item.tvlUSD
      lastPrice = item.priceUSD
      result.push(item)
    }

    return result
  }
  return firstData.map(ele => {
    const found = secondData.find(item => item.date === ele.date)
    return {
      date: ele.date,
      tvlUSD: ele.tvlUSD + (found?.tvlUSD ?? 0),
      dailyVolumeUSD: ele.dailyVolumeUSD + (found?.dailyVolumeUSD ?? 0),
      priceUSD: ele && ele.priceUSD ? ele.priceUSD : found && found.priceUSD ? found.priceUSD : 0,
    }
  })
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
      tvlUSD: token?.liquidity || chartData?.[chartData.length - 1]?.tvlUSD,
      dailyVolumeUSD: token?.volume || chartData?.[chartData.length - 1]?.dailyVolumeUSD,
      priceUSD: token?.price || chartData?.[chartData.length - 1]?.priceUSD,
    }),
    [token, chartData],
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
