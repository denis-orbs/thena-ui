import dayjs from 'dayjs'
import { isArray } from 'lodash'
import { useTranslations } from 'next-intl'
import { memo, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Toggle from '@/components/toggle'
import { fetchStats } from '@/lib/subgraph'
import { cn, formatAmount } from '@/lib/utils'
import { Expand04Icon } from '@/svgs'

import Box from '../box'
import { TextIconButton } from '../buttons/IconButton'
import Divider from '../divider'
import Selection from '../selection'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'

/** Base on HoverableChart and can support stacked bar chart and group data by epoch */

function EpochStackableChart({
  groupEpochData,
  rawData,
  protocolData,
  valueProperty,
  protocolProperty,
  title,
  ChartComponent,
  className,
  classNames,
  chartId,
  propertyLabel,
  showPerEpoch = true,
  isExpanded,
  onExpand,
}) {
  const [groupPerEpoch, setGroupPerEpoch] = useState(false)
  const [property, setProperty] = useState('all')
  const [period, setPeriod] = useState(1)
  const [hover, setHover] = useState()
  const [dateHover, setDateHover] = useState()
  const t = useTranslations()

  const { data: dataRevenue } = useSWR('thena total stats', () => fetchStats())

  // Getting latest data to display on top of chart when not hovered
  useEffect(() => {
    setHover(undefined)
  }, [protocolData])

  useEffect(() => {
    if (protocolData) {
      setHover(protocolData[protocolProperty])
      setDateHover()
    }
  }, [protocolData, protocolProperty])

  useEffect(() => {
    setHover(protocolData?.[protocolProperty] || undefined)
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
    <Box className={cn('bg-chart-gradient border border-[#422D4C]', className)}>
      <div className={cn('flex flex-col gap-4', !isExpanded && 'gap-2')}>
        <div className={cn('flex justify-between', !isExpanded && 'flex-col gap-2')}>
          <div className={cn('flex flex-col gap-2', !isExpanded && 'flex-row items-center justify-between')}>
            <Paragraph className={cn('text-base font-semibold text-neutral-50 lg:text-3xl', classNames?.title)}>
              {t(title)}
            </Paragraph>
            {showPerEpoch && (
              <Toggle
                className='hidden lg:flex'
                checked={groupPerEpoch}
                onChange={() => setGroupPerEpoch(!groupPerEpoch)}
                toggleId={`active-epoch-${chartId}`}
                label='Per Epoch'
              />
            )}
            {!isExpanded && (
              <TextIconButton
                Icon={Expand04Icon}
                className='h-6! w-6! stroke-neutral-400'
                onClick={() => {
                  onExpand()
                }}
              />
            )}
          </div>
          <div className='flex items-center justify-between gap-1'>
            {!isExpanded && (
              <div className='flex flex-col gap-1'>
                {Number(hover) > -1 ? ( // sometimes data is 0
                  <TextHeading className={cn('text-xl! leading-6!')}>${formatAmount(hover)}</TextHeading>
                ) : (
                  <TextHeading className={cn('text-xl! leading-6!')}>
                    ${formatAmount(dataRevenue?.revenueData)}
                  </TextHeading>
                )}
              </div>
            )}
            {properties && (
              <Selection
                className={cn('items-stretch md:h-11', !isExpanded && 'h-8! bg-transparent')}
                classNames={{
                  items: cn('md:text-sm text-xs', !isExpanded && 'text-xs! h-6! py-1! px-2!'),
                }}
                data={properties}
              />
            )}
          </div>
        </div>
        <Divider />
        <div className='flex items-start justify-between'>
          <div className='flex flex-col gap-1'>
            {isExpanded && (
              <>
                {Number(hover) > -1 ? ( // sometimes data is 0
                  <TextHeading className='text-2xl'>${formatAmount(hover)}</TextHeading>
                ) : (
                  <TextHeading className={cn('text-2xl')}>${formatAmount(dataRevenue?.revenueData)}</TextHeading>
                )}
              </>
            )}
            {dateHover ? <TextSubHeading>{dateHover}</TextSubHeading> : <div className='h-5' />}
          </div>

          <Selection
            className={cn('items-stretch md:h-11', !isExpanded && 'h-8! bg-transparent')}
            classNames={{
              items: cn('md:text-sm! text-xs py-2! px-3!', !isExpanded && 'text-xs! h-6! py-1! px-2!'),
            }}
            data={periods}
          />
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
