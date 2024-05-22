import { gql } from 'graphql-request'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import MultipleLineChart from '@/components/charts/MultipleLineChart'
import Tabs, { TabPanel } from '@/components/tabs'
import { v4Client } from '@/lib/graphql'

import AnalyticChart from './AnalyticChart'
import { TCLines } from './constants'

const V4_ENTRY_FEE_ANALYTICS = gql`
  query V4_ENTRY_FEE_ANALYTICS($where: ArenaAnalyticsWhereInput) {
    arenaAnalytics(where: $where, orderBy: date_ASC) {
      entryFeesPaid {
        cumulativePerpetual
        cumulativeSpot
        spot
        perpetual
        cumulativeTotal
        total
      }
      date
    }
  }
`
const fetchEntryFees = async date => {
  try {
    const where = date ? { date_gte: date } : {}
    const { arenaAnalytics } = await v4Client.request(V4_ENTRY_FEE_ANALYTICS, { where })
    if (arenaAnalytics) {
      const spotData = []
      const perpetualData = []
      const totalData = []
      arenaAnalytics.forEach(item => {
        spotData.push({
          date: item.date,
          total: item.entryFeesPaid.spot,
          cumulativeTotal: item.entryFeesPaid.cumulativeSpot,
        })
        perpetualData.push({
          date: item.date,
          total: item.entryFeesPaid.perpetual,
          cumulativeTotal: item.entryFeesPaid.cumulativePerpetual,
        })
        totalData.push({
          date: item.date,
          total: item.entryFeesPaid.total,
          cumulativeTotal: item.entryFeesPaid.cumulativeTotal,
        })
      })

      return [[...spotData], [...perpetualData], [...totalData]]
    }
  } catch (error) {
    return null
  }
}

export function EntryFeeChart() {
  const [filter, setFilter] = useState(null)

  const { data: dataChart } = useSWR(['analytic entry fee', filter], () => fetchEntryFees(filter))

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
          ChartComponent={MultipleLineChart}
          chartsData={dataChart}
          valueProperty='total'
          protocolData={dataChart && dataChart.map(item => item.at(-1))}
          lines={TCLines}
          setFilter={setFilter}
        />
      </TabPanel>
      <TabPanel value={tabPanel} select='Cumulative'>
        <AnalyticChart
          ChartComponent={MultipleLineChart}
          chartsData={dataChart}
          valueProperty='cumulativeTotal'
          protocolData={dataChart && dataChart.map(item => item.at(-1))}
          lines={TCLines}
          setFilter={setFilter}
        />
      </TabPanel>
    </>
  )
}
