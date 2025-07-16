import dayjs from 'dayjs'
import { isArray } from 'lodash'
import { useTranslations } from 'next-intl'
import { memo, useEffect, useMemo, useState } from 'react'

import Toggle from '@/components/toggle'
import { cn, formatAmount } from '@/lib/utils'

import Box from '../box'
import Divider from '../divider'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'

/** Base on HoverableChart and can support stacked bar chart and group data by epoch */

function EpochStackableChart({
  groupEpochData,
  rawData,
  protocolData,
  valueProperty,
  title,
  ChartComponent,
  className,
  chartId,
  propertyLabel,
}) {
  const [groupPerEpoch, setGroupPerEpoch] = useState(false)
  const [property, setProperty] = useState('all')
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
  const chartData = useMemo(() => (groupPerEpoch ? groupEpochData : rawData), [rawData, groupPerEpoch, groupEpochData])

  const formattedData = useMemo(
    () =>
      (chartData || [])
        .filter(ele => {
          if (!period) return true
          const startTimestamp = dayjs().subtract(period, 'month').unix()
          return ele.date > startTimestamp
        })
        .sort((a, b) => (groupPerEpoch ? a.epoch - b.epoch : a.date - b.date))
        .map(item =>
          isArray(valueProperty)
            ? {
                ...item,
                time: dayjs.unix(item.date).toDate(),
              }
            : {
                time: dayjs.unix(item.date).toDate(),
                epoch: groupPerEpoch ? item.epoch : null,
                value: item[valueProperty],
              },
        ),
    [chartData, valueProperty, period, groupPerEpoch],
  )

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
  const properties = useMemo(
    () =>
      isArray(valueProperty) && valueProperty.length > 1
        ? [
            {
              label: 'All',
              active: property === 'all',
              onClickHandler: () => {
                setProperty('all')
              },
            },
            ...valueProperty.map(item => ({
              label: propertyLabel[item] ?? '',
              active: property === item,
              onClickHandler: () => {
                setProperty(item)
              },
            })),
          ]
        : null,
    [property, propertyLabel, valueProperty],
  )

  return (
    <Box className={cn(className)}>
      <div className='flex flex-col gap-4'>
        <div className='flex justify-between'>
          <div className='flex flex-col gap-2'>
            <Paragraph className='text-base font-semibold text-neutral-50 lg:text-3xl'>{t(title)}</Paragraph>
            <Toggle
              className='hidden lg:flex'
              checked={groupPerEpoch}
              onChange={() => setGroupPerEpoch(!groupPerEpoch)}
              toggleId={`active-epoch-${chartId}`}
              label='Per Epoch'
            />
          </div>
          {properties && <Tabs data={properties} />}
        </div>
        <Divider />
        <div className='flex items-start justify-between'>
          <div className='flex flex-col gap-1'>
            {Number(hover) > -1 ? ( // sometimes data is 0
              <TextHeading className='text-2xl'>${formatAmount(hover)}</TextHeading>
            ) : (
              <Skeleton className='h-[32px] w-[128px]' />
            )}
            {dateHover ? <TextSubHeading>{dateHover}</TextSubHeading> : <div className='h-5' />}
          </div>

          <Tabs data={periods} />
        </div>
      </div>
      <div className='mt-2 h-[250px]'>
        <ChartComponent
          data={formattedData}
          setHoverValue={setHover}
          setHoverDate={setDateHover}
          useEpoch={groupPerEpoch}
          valueProperty={property === 'all' ? valueProperty : [property]}
        />
      </div>
    </Box>
  )
}

export default memo(EpochStackableChart)
