import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { memo, useEffect, useMemo, useState } from 'react'

import { cn, formatAmount } from '@/lib/utils'

import Box from '../box'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'

function HoverableChart({
  chartData,
  protocolData,
  valueProperty,
  title,
  ChartComponent,
  className,
  isSimple = false,
}) {
  const [period, setPeriod] = useState(1)
  const [hover, setHover] = useState()
  const [dateHover, setDateHover] = useState()
  const t = useTranslations()

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

  useEffect(() => {
    setHover(protocolData?.[valueProperty] || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

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

  return isSimple ? (
    <div className='h-[150px]'>
      <ChartComponent data={formattedData} setHoverValue={setHover} setHoverDate={setDateHover} isSimple />
    </div>
  ) : (
    <Box className={cn(className)}>
      <div className='flex flex-col items-start justify-between max-lg:gap-2 lg:flex-row'>
        <div className='flex flex-col gap-1'>
          <Paragraph className='max-lg:hidden'>{t(title)}</Paragraph>
          {Number(hover) > -1 ? ( // sometimes data is 0
            <TextHeading className='font-archia text-xl leading-6 font-semibold lg:text-2xl'>
              ${formatAmount(hover)}
            </TextHeading>
          ) : (
            <Skeleton className='h-6 w-[128px] lg:h-8' />
          )}
          {dateHover ? (
            <TextSubHeading className='max-lg:hidden'>{dateHover}</TextSubHeading>
          ) : (
            <div className='h-5 max-lg:hidden' />
          )}
        </div>

        <Tabs
          data={periods}
          className='max-lg:w-full max-lg:p-1'
          itemClassName='w-full h-6 lg:h-8 items-center max-lg:py-1!'
        />
      </div>

      <div className='mt-2 h-[250px]'>
        <ChartComponent data={formattedData} setHoverValue={setHover} setHoverDate={setDateHover} />
      </div>
    </Box>
  )
}

export default memo(HoverableChart)
