import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import React, { memo, useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'

dayjs.extend(utc)

function AnalyticChart({ numberFormat, chartData, protocolData, valueProperty, ChartComponent, setFilter }) {
  const [period, setPeriod] = useState(0)
  const [hover, setHover] = useState()
  const [dateHover, setDateHover] = useState()

  useEffect(() => {
    setHover(undefined)
  }, [protocolData])

  useEffect(() => {
    if (typeof hover === 'undefined' && protocolData) {
      setHover(protocolData[valueProperty])
      setDateHover()
    }
  }, [protocolData, hover, valueProperty])

  const formattedData = useMemo(() => {
    if (chartData) {
      return chartData.map(day => ({
        time: dayjs(day.date).toDate(),
        value: day[valueProperty],
      }))
    }
    return []
  }, [chartData, valueProperty])

  useEffect(() => {
    if (setFilter) {
      switch (period) {
        case 1:
          return setFilter(dayjs().subtract(1, 'month').utc().format())
        case 3:
          return setFilter(dayjs().subtract(3, 'month').utc().format())
        case 6:
          return setFilter(dayjs().subtract(6, 'month').utc().format())
        default:
          return setFilter(null)
      }
    }
  }, [period, setFilter])

  const periods = useMemo(
    () => [
      {
        label: '1M',
        active: period === 1,
        onClickHandler: () => {
          setPeriod(1)
        },
      },
      {
        label: '3M',
        active: period === 3,
        onClickHandler: () => {
          setPeriod(3)
        },
      },
      {
        label: '6M',
        active: period === 6,
        onClickHandler: () => {
          setPeriod(6)
        },
      },
      {
        label: 'All',
        active: period === 0,
        onClickHandler: () => {
          setPeriod(0)
        },
      },
    ],
    [period],
  )

  return (
    <Box>
      <div className='flex items-start justify-between'>
        <div className='flex flex-col gap-1'>
          {Number(hover) > -1 ? ( // sometimes data is 0
            <TextHeading className='text-2xl'>{numberFormat ? hover : `$${formatAmount(hover)}`}</TextHeading>
          ) : (
            <Skeleton className='h-[32px] w-[128px]' />
          )}
          {dateHover ? <TextSubHeading>{dateHover}</TextSubHeading> : <div className='h-5' />}
        </div>

        <Tabs data={periods} />
      </div>
      <div className='mt-2 h-[250px]'>
        <ChartComponent
          data={formattedData}
          setHoverValue={setHover}
          setHoverDate={setDateHover}
          numberFormat={numberFormat}
        />
      </div>
    </Box>
  )
}

export default memo(AnalyticChart)
