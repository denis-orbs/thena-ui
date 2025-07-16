import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { memo, useEffect, useMemo, useState } from 'react'

import { cn, formatAmount } from '@/lib/utils'

import AnalyticsReChart from './AnalyticsReChart'
import Box from '../box'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'

function HoverAbleReChart({
  chartData,
  protocolData,
  valueProperty,
  title,
  type = 'bar',
  className,
  chartItemConfigs,
  chartConfig,
  isMinimum = false,
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
          [valueProperty]: day[valueProperty],
        }))
    }
    return []
  }, [chartData, valueProperty, period])

  // Calculate current price for stacked charts
  const currentPrice = useMemo(() => {
    if (!formattedData?.length || !chartItemConfigs?.length) return undefined

    const lastDataPoint = formattedData[formattedData.length - 1]
    const activeConfigs = chartItemConfigs

    // For stacked charts (multiple data keys), sum all values
    if (activeConfigs.length > 1) {
      return activeConfigs.reduce((sum, config) => sum + (lastDataPoint[config.dataKey] || 0), 0)
    }

    // For single data key, use the value directly
    return lastDataPoint[activeConfigs[0]?.dataKey]
  }, [formattedData, chartItemConfigs])

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
    <Box className={cn(className)}>
      <div className='flex flex-col items-start justify-between max-lg:gap-2 lg:flex-row'>
        <div className='flex flex-col gap-1'>
          <Paragraph className='max-lg:hidden'>{t(title)}</Paragraph>
          {Number(hover) > -1 ? ( // sometimes data is 0
            <TextHeading className='font-archia text-xl! leading-6! font-medium! lg:text-2xl! lg:leading-8!'>
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
        <AnalyticsReChart
          data={formattedData}
          setHoverValue={setHover}
          setHoverDate={setDateHover}
          chartType={type}
          xAsisKey='time'
          chartConfig={chartConfig}
          chartItemConfigs={chartItemConfigs}
          useEpoch={false}
          showCurrentPrice
          desiredTicks={isMinimum ? 4 : 12}
          currentPrice={currentPrice}
        />
      </div>
    </Box>
  )
}

export default memo(HoverAbleReChart)
