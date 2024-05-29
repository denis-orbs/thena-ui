import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import LineChart from '@/components/charts/LineChart'
import Tabs, { TabPanel } from '@/components/tabs'
import { v4Client } from '@/lib/graphql'

import AnalyticChart from './AnalyticChart'

const V4_MINTED_ANALYTICS = gql`
  query V4_MINTED_ANALYTICS($where: ArenaAnalyticsWhereInput) {
    arenaAnalytics(where: $where, orderBy: date_ASC) {
      thenaIdsMintedCount {
        cumulativeTotal
        total
      }
      date
    }
  }
`
const fetchCreatedTC = async period => {
  try {
    const where = period ? { date_gte: dayjs().subtract(period, 'month').utc().format('YYYY-MM-DDTHH:mm:ss[Z]') } : {}
    const { arenaAnalytics } = await v4Client.request(V4_MINTED_ANALYTICS, {
      where,
    })
    if (arenaAnalytics) {
      return arenaAnalytics.map(val => ({
        total: val.thenaIdsMintedCount.total,
        cumulativeTotal: val.thenaIdsMintedCount.cumulativeTotal,
        date: val.date,
      }))
    }
  } catch (error) {
    return null
  }
}

export function MintedChart() {
  const [filter, setFilter] = useState(0)

  const { data: dataChart } = useSWR(['analytic minted', filter], () => fetchCreatedTC(filter))

  const [tabPanel, setTabPanel] = useState('Cumulative')

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
          filter={filter}
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
          filter={filter}
          setFilter={setFilter}
          numberFormat
        />
      </TabPanel>
    </>
  )
}
