import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import LineChart from '@/components/charts/LineChart'
import Tabs, { TabPanel } from '@/components/tabs'
import { getSubarrayFromFirstDataToLast } from '@/lib/analytics'
import { v4Client } from '@/lib/graphql'

import AnalyticChart from './AnalyticChart'
import { TCLines } from './constants'

const V4_VOLUME_ANALYTICS = gql`
  query V4_VOLUME_ANALYTICS($where: ArenaAnalyticsWhereInput) {
    arenaAnalytics(where: $where, orderBy: date_ASC) {
      arenaVolume {
        cumulativePerpetual
        cumulativeTotal
        cumulativeSpot
        perpetual
        spot
        total
      }
      date
    }
  }
`
const fetchCreatedTC = async period => {
  try {
    const where = period ? { date_gte: dayjs().subtract(period, 'month').utc().format('YYYY-MM-DDTHH:mm:ss[Z]') } : {}
    const { arenaAnalytics } = await v4Client.request(V4_VOLUME_ANALYTICS, {
      where,
    })
    if (arenaAnalytics) {
      const spotData = []
      const perpetualData = []
      const totalData = []
      arenaAnalytics.forEach(item => {
        spotData.push({
          date: item.date,
          total: item.arenaVolume.spot,
          cumulativeTotal: item.arenaVolume.cumulativeSpot,
        })
        perpetualData.push({
          date: item.date,
          total: item.arenaVolume.perpetual,
          cumulativeTotal: item.arenaVolume.cumulativePerpetual,
        })
        totalData.push({
          date: item.date,
          total: item.arenaVolume.total,
          cumulativeTotal: item.arenaVolume.cumulativeTotal,
        })
      })

      return [
        [...getSubarrayFromFirstDataToLast(spotData, 'total')],
        [...getSubarrayFromFirstDataToLast(perpetualData, 'total')],
        [...getSubarrayFromFirstDataToLast(totalData, 'total')],
      ]
    }
  } catch (error) {
    return null
  }
}

export function VolumeChart() {
  const [filter, setFilter] = useState(0)

  const { data: dataChart } = useSWR(['analytic volume', filter], () => fetchCreatedTC(filter))

  const [tabPanel, setTabPanel] = useState('Cumulative')
  const [tabFilter, setTabFilter] = useState('All')

  const chartDataFilter = useMemo(() => {
    if (dataChart) {
      switch (tabFilter) {
        case 'Spot':
          return dataChart[0]
        case 'Perpetual':
          return dataChart[1]
        default:
          return dataChart[2]
      }
    }
  }, [dataChart, tabFilter])
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

  const filterTC = useMemo(
    () => [
      {
        label: 'All',
        active: tabFilter === 'All',
        onClickHandler: () => {
          setTabFilter('All')
        },
      },
      {
        label: 'Spot',
        active: tabFilter === 'Spot',
        onClickHandler: () => {
          setTabFilter('Spot')
        },
      },
      {
        label: 'Perpetual',
        active: tabFilter === 'Perpetual',
        onClickHandler: () => {
          setTabFilter('Perpetual')
        },
      },
    ],
    [tabFilter],
  )

  return (
    <>
      <div className='flex justify-between'>
        <Tabs data={panel} className='my-2 justify-start' />
        <Tabs data={filterTC} className='my-2 justify-start' />
      </div>
      <TabPanel value={tabPanel} select='New'>
        <AnalyticChart
          ChartComponent={LineChart}
          chartData={chartDataFilter}
          valueProperty='total'
          protocolData={chartDataFilter && chartDataFilter.at(-1)}
          lines={TCLines}
          setFilter={setFilter}
          filter={filter}
        />
      </TabPanel>
      <TabPanel value={tabPanel} select='Cumulative'>
        <AnalyticChart
          ChartComponent={LineChart}
          chartData={chartDataFilter}
          valueProperty='cumulativeTotal'
          protocolData={chartDataFilter && chartDataFilter.at(-1)}
          setFilter={setFilter}
          filter={filter}
          lines={TCLines}
        />
      </TabPanel>
    </>
  )
}
