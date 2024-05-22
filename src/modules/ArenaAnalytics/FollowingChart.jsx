import { gql } from 'graphql-request'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import LineChart from '@/components/charts/LineChart'
import Tabs, { TabPanel } from '@/components/tabs'
import { v4Client } from '@/lib/graphql'

import AnalyticChart from './AnalyticChart'

const V4_FOLLOWING_ANALYTICS = gql`
  query V4_FOLLOWING_ANALYTICS($where: ArenaAnalyticsWhereInput) {
    arenaAnalytics(where: $where, orderBy: date_ASC) {
      followingCount {
        cumulativeTotal
        total
      }
      date
    }
  }
`
const fetchCreatedTC = async date => {
  try {
    const where = date ? { date_gte: date } : {}
    const { arenaAnalytics } = await v4Client.request(V4_FOLLOWING_ANALYTICS, {
      where,
    })
    if (arenaAnalytics) {
      return arenaAnalytics.map(val => ({
        total: val.followingCount.total,
        cumulativeTotal: val.followingCount.cumulativeTotal,
        date: val.date,
      }))
    }
    return null
  } catch (error) {
    return null
  }
}
export function FollowingChart() {
  const [filter, setFilter] = useState(null)

  const { data: dataChart } = useSWR(['analytic following created', filter], () => fetchCreatedTC(filter))

  const [tabPanel, setTabPanel] = useState('New')

  const panel = useMemo(
    () => [
      {
        label: 'New',
        active: tabPanel === 'New',
        onClickHandler: () => {
          setTabPanel('New')
        },
      },
      {
        label: 'Cumulative',
        active: tabPanel === 'Cumulative',
        onClickHandler: () => {
          setTabPanel('Cumulative')
        },
      },
    ],
    [tabPanel],
  )

  return (
    <>
      <Tabs data={panel} className='my-2 justify-start' />
      <TabPanel value={tabPanel} select='New'>
        <AnalyticChart
          ChartComponent={LineChart}
          chartData={dataChart}
          valueProperty='total'
          protocolData={dataChart && dataChart.at(-1)}
          setFilter={setFilter}
          numberFormat
        />
      </TabPanel>
      <TabPanel value={tabPanel} select='Cumulative'>
        <AnalyticChart
          ChartComponent={LineChart}
          chartData={dataChart}
          valueProperty='cumulativeTotal'
          protocolData={dataChart && dataChart.at(-1)}
          setFilter={setFilter}
          numberFormat
        />
      </TabPanel>
    </>
  )
}
