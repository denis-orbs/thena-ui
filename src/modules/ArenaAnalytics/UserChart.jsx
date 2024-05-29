import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import LineChart from '@/components/charts/LineChart'
import Tabs, { TabPanel } from '@/components/tabs'
import { v4Client } from '@/lib/graphql'

import AnalyticChart from './AnalyticChart'

const V4_USER_CREATED_ANALYTICS = gql`
  query V4_USER_CREATED_ANALYTICS($where: ArenaAnalyticsWhereInput) {
    arenaAnalytics(where: $where, orderBy: date_ASC) {
      newUsersCount
      cumulativeUsersCount
      date
    }
  }
`
const fetchCreatedTC = async period => {
  try {
    const where = period ? { date_gte: dayjs().subtract(period, 'month').utc().format('YYYY-MM-DDTHH:mm:ss[Z]') } : {}
    const { arenaAnalytics } = await v4Client.request(V4_USER_CREATED_ANALYTICS, {
      where,
    })
    return arenaAnalytics
  } catch (error) {
    return null
  }
}

function UserChart() {
  const [filter, setFilter] = useState(0)

  const { data: dataChart } = useSWR(['analytic user created', filter], () => fetchCreatedTC(filter))
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
          valueProperty='newUsersCount'
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
          valueProperty='cumulativeUsersCount'
          protocolData={dataChart && dataChart.at(-1)}
          filter={filter}
          setFilter={setFilter}
          numberFormat
        />
      </TabPanel>
    </>
  )
}

export default UserChart
