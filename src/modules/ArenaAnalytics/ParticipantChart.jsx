import { gql } from 'graphql-request'
import React, { useState } from 'react'
import useSWR from 'swr'

import LineChart from '@/components/charts/LineChart'
import { v4Client } from '@/lib/graphql'

import AnalyticChart from './AnalyticChart'

const V4_PARTICIPANT_ANALYTICS = gql`
  query V4_PARTICIPANT_ANALYTICS($where: ArenaAnalyticsWhereInput) {
    arenaAnalytics(where: $where, orderBy: date_ASC) {
      participantsCount
      date
    }
  }
`
const fetchCreatedTC = async date => {
  try {
    const where = date ? { date_gte: date } : {}
    const { arenaAnalytics } = await v4Client.request(V4_PARTICIPANT_ANALYTICS, {
      where,
    })
    return arenaAnalytics
  } catch (error) {
    return null
  }
}

export function ParticipantChart() {
  const [filter, setFilter] = useState(null)

  const { data: dataChart } = useSWR(['analytic participant', filter], () => fetchCreatedTC(filter))

  return (
    <AnalyticChart
      ChartComponent={LineChart}
      chartData={dataChart}
      valueProperty='participantsCount'
      protocolData={dataChart && dataChart.at(-1)}
      setFilter={setFilter}
      numberFormat
    />
  )
}
