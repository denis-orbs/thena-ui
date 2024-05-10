import { gql } from 'graphql-request'
import React, { useState } from 'react'
import useSWR from 'swr'

import LineChart from '@/components/charts/LineChart'
import { v4Client } from '@/lib/graphql'

import AnalyticChart from './AnalyticChart'

const V4_PRIZE_POOL_ANALYTICS = gql`
  query V4_PRIZE_POOL_ANALYTICS($where: ArenaAnalyticsWhereInput) {
    arenaAnalytics(where: $where, orderBy: date_ASC) {
      prizePools
      date
    }
  }
`
const fetchCreatedTC = async date => {
  try {
    const where = date ? { date_gte: date } : {}
    const { arenaAnalytics } = await v4Client.request(V4_PRIZE_POOL_ANALYTICS, {
      where,
    })
    return arenaAnalytics
  } catch (error) {
    return null
  }
}

export function PrizePoolChart() {
  const [filter, setFilter] = useState(null)

  const { data: dataChart } = useSWR(['analytic prize pool', filter], () => fetchCreatedTC(filter))

  return (
    <AnalyticChart
      ChartComponent={LineChart}
      chartData={dataChart}
      valueProperty='prizePools'
      protocolData={dataChart && dataChart.at(-1)}
      setFilter={setFilter}
    />
  )
}
