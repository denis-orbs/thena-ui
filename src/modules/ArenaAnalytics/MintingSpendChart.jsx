import { gql } from 'graphql-request'
import React, { useState } from 'react'
import useSWR from 'swr'

import LineChart from '@/components/charts/LineChart'
import { v4Client } from '@/lib/graphql'

import AnalyticChart from './AnalyticChart'

const V4_MINTING_SPEND_ANALYTICS = gql`
  query V4_MINTING_SPEND_ANALYTICS($where: ArenaAnalyticsWhereInput) {
    arenaAnalytics(where: $where, orderBy: date_ASC) {
      totalThenaIdsMintedUSD
      date
    }
  }
`
const fetchCreatedTC = async date => {
  try {
    const where = date ? { date_gte: date } : {}
    const { arenaAnalytics } = await v4Client.request(V4_MINTING_SPEND_ANALYTICS, {
      where,
    })
    return arenaAnalytics
  } catch (error) {
    return null
  }
}

export function MintingSpendChart() {
  const [filter, setFilter] = useState(null)

  const { data: dataChart } = useSWR(['analytic minting spend', filter], () => fetchCreatedTC(filter))

  return (
    <AnalyticChart
      ChartComponent={LineChart}
      chartData={dataChart}
      valueProperty='totalThenaIdsMintedUSD'
      protocolData={dataChart && dataChart.at(-1)}
      setFilter={setFilter}
    />
  )
}
