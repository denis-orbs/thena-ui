import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { memo, useEffect, useMemo, useState } from 'react'

import { cn, formatAmount } from '@/lib/utils'
import { Expand04Icon } from '@/svgs'

import Box from '../box'
import { TextIconButton } from '../buttons/IconButton'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'

function HoverableChart({
  chartData,
  protocolData,
  valueProperty,
  onExpand,
  isExpanded,
  title,
  ChartComponent,
  className,
  classNames,
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

  return (
    <Box className={cn('flex h-full flex-col', className)}>
      <div className='flex-grow'>
        <div className='flex flex-col justify-between gap-2'>
          <div className='flex items-start justify-between'>
            <Paragraph className={cn('text-xl font-semibold text-neutral-500', classNames?.title)}>
              {t(title)}
            </Paragraph>
            {!isExpanded ? (
              <TextIconButton
                Icon={Expand04Icon}
                className='h-6! w-6! stroke-neutral-400'
                onClick={() => {
                  onExpand()
                }}
              />
            ) : (
              <Tabs data={periods} />
            )}
          </div>
          <div className='flex items-center justify-between gap-1'>
            {Number(hover) > -1 ? (
              <TextHeading className='text-xl font-semibold text-neutral-50'>${formatAmount(hover)}</TextHeading>
            ) : (
              <Skeleton className='h-[30px] w-[128px]' />
            )}
            {dateHover ? <TextSubHeading>{dateHover}</TextSubHeading> : <div className='h-5' />}
            {!isExpanded && <Tabs data={periods} />}
          </div>
        </div>
      </div>

      <div className='mt-2 h-[250px]'>
        <ChartComponent data={formattedData} setHoverValue={setHover} setHoverDate={setDateHover} />
      </div>
    </Box>
  )
}

export default memo(HoverableChart)
