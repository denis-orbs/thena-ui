import { gql } from 'graphql-request'
import React, { useState } from 'react'
import useSWR from 'swr'

import LineChart from '@/components/charts/LineChart'
import { v4Client } from '@/lib/graphql'

import AnalyticChart from './AnalyticChart'

const V4_MINTED_ANALYTICS = gql`
  query V4_MINTED_ANALYTICS($where: ArenaAnalyticsWhereInput) {
    arenaAnalytics(where: $where, orderBy: date_ASC) {
      thenaIdsMintedCount
      date
    }
  }
`
const fetchCreatedTC = async date => {
  try {
    const where = date ? { date_gte: date } : {}
    const { arenaAnalytics } = await v4Client.request(V4_MINTED_ANALYTICS, {
      where,
    })
    return arenaAnalytics
  } catch (error) {
    return null
  }
}

export function MintedChart() {
  const [filter, setFilter] = useState(null)

  const { data: dataChart } = useSWR(['analytic minted', filter], () => fetchCreatedTC(filter))

  return (
    <AnalyticChart
      ChartComponent={LineChart}
      chartData={dataChart}
      valueProperty='thenaIdsMintedCount'
      protocolData={dataChart && dataChart.at(-1)}
      setFilter={setFilter}
      numberFormat
    />
  )
}
