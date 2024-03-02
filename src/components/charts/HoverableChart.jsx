import dayjs from 'dayjs'
import { memo, useEffect, useMemo, useState } from 'react'

import { formatAmount } from '@/lib/utils'

import Box from '../box'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'

function HoverableChart({ chartData, protocolData, valueProperty, title, ChartComponent }) {
  const [period, setPeriod] = useState(1)
  const [hover, setHover] = useState()
  const [dateHover, setDateHover] = useState()

  // Getting latest data to display on top of chart when not hovered
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
      return chartData
        .filter(ele => {
          if (!period) return true
          const startTimestamp = dayjs().subtract(period, 'month').unix()
          return ele.date > startTimestamp
        })
        .sort((a, b) => a.date - b.date)
        .map(day => ({
          time: dayjs.unix(day.date).toDate(),
          value: day[valueProperty],
        }))
    }
    return []
  }, [chartData, valueProperty, period])

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
          <Paragraph>{title}</Paragraph>
          {Number(hover) > -1 ? ( // sometimes data is 0
            <TextHeading className='text-2xl'>${formatAmount(hover)}</TextHeading>
          ) : (
            <Skeleton className='h-[32px] w-[128px]' />
          )}
          {dateHover ? <TextSubHeading>{dateHover}</TextSubHeading> : <div className='h-5' />}
        </div>

        <Tabs data={periods} />
      </div>
      <div className='mt-2 h-[250px]'>
        <ChartComponent data={formattedData} setHoverValue={setHover} setHoverDate={setDateHover} />
      </div>
    </Box>
  )
}

export default memo(HoverableChart)
