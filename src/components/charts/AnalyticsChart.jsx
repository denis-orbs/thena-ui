import dayjs from 'dayjs'
import { pick } from 'lodash'
import { useTranslations } from 'next-intl'
import { memo, useEffect, useMemo, useState } from 'react'

import Toggle from '@/components/toggle'
import { cn, formatAmount } from '@/lib/utils'
import { Expand04Icon } from '@/svgs'

import AnalyticsReChart from './AnalyticsReChart'
import Box from '../box'
import { TextIconButton } from '../buttons/IconButton'
import Divider from '../divider'
import Selection from '../selection'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'

/** Base on HoverableChart and can support stacked bar chart and group data by epoch */

function AnalyticsChart({
  epochData,
  rawData,
  protocolData,
  protocolProperty,
  defaultDateHover,
  title,
  className,
  classNames,
  chartId,
  isExpanded,
  onExpand,
  chartConfig,
  chartItemConfigs,
  chartType = 'bar',
  onHoverChange,
  isMinimum = false,
  valueDefault,
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
    if (protocolData) {
      setHover(protocolData[protocolProperty])
      setDateHover(defaultDateHover)
    }
  }, [protocolData, protocolProperty, defaultDateHover])

  useEffect(() => {
    setHover(protocolData?.[protocolProperty] || undefined)
    setDateHover(defaultDateHover)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  const chartData = useMemo(() => (groupPerEpoch ? epochData : rawData), [rawData, groupPerEpoch, epochData])
  useEffect(() => {
    if (!onHoverChange) return
    if (hover === undefined) {
      onHoverChange(valueDefault || protocolData?.[protocolProperty])
      return
    }
    onHoverChange(hover)
  }, [hover, onHoverChange, protocolData, protocolProperty, valueDefault])

  const formattedData = useMemo(
    () =>
      (chartData || [])
        .filter(ele => {
          if (!period) return true
          const startTimestamp = dayjs().subtract(period, 'month').unix()
          return ele.date > startTimestamp
        })
        .sort((a, b) => (groupPerEpoch ? a.epoch - b.epoch : a.date - b.date))
        .map(item => ({
          ...item,
          time: dayjs.unix(item.date).toDate(),
        })),
    [chartData, period, groupPerEpoch],
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
      Object.keys(chartConfig).length > 1
        ? [
            {
              label: 'All',
              active: property === 'all',
              onClickHandler: () => {
                setProperty('all')
              },
            },
            ...Object.keys(chartConfig).map(key => ({
              label: chartConfig[key].label ?? '',
              active: property === key,
              onClickHandler: () => {
                setProperty(key)
              },
            })),
          ]
        : null,
    [property, chartConfig],
  )

  return (
    <Box className={cn('bg-chart-gradient border border-[#422D4C]', className)}>
      <div className={cn('flex flex-col gap-4', !isExpanded && 'gap-2')}>
        <div className={cn('flex justify-between', !isExpanded && 'flex-col gap-2')}>
          {isMinimum ? (
            <>
              {properties && (
                <Selection
                  className={cn('w-full bg-transparent')}
                  classNames={{
                    items: cn('md:text-sm! text-x! flex-1'),
                  }}
                  data={properties}
                />
              )}
            </>
          ) : (
            <>
              <div className={cn('flex flex-col gap-2', !isExpanded && 'flex-row items-center justify-between')}>
                <Paragraph className={cn('text-base font-semibold text-neutral-50 lg:text-3xl', classNames?.title)}>
                  {t(title)}
                </Paragraph>
                {!!epochData?.length && (
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
                      <TextHeading className={cn('text-xl! leading-6!')}>${formatAmount(valueDefault)}</TextHeading>
                    )}
                    {dateHover ? <TextSubHeading>{dateHover}</TextSubHeading> : <div className='h-5' />}
                  </div>
                )}
                {properties ? (
                  <Selection
                    className={cn('items-stretch bg-transparent md:h-11')}
                    classNames={{
                      items: cn('md:text-sm! text-x! flex-1'),
                    }}
                    data={properties}
                  />
                ) : (
                  <Selection
                    className={cn('items-stretch md:h-11', !isExpanded && 'h-8! bg-transparent')}
                    classNames={{
                      items: cn('md:text-sm! text-xs py-2! px-3!', !isExpanded && 'text-xs! h-6! py-1! px-2!'),
                    }}
                    data={periods}
                  />
                )}
              </div>
            </>
          )}
        </div>
        {properties && <Divider />}
        {isMinimum ? (
          <>
            <Selection
              className={cn('w-full bg-transparent')}
              classNames={{
                items: cn('text-xs h-6! py-1! px-2! flex-1'),
              }}
              data={periods}
            />
          </>
        ) : (
          <div className='flex items-start justify-between'>
            <div>
              {isExpanded && (
                <div className='flex flex-col gap-1'>
                  <>
                    {Number(hover) > -1 ? ( // sometimes data is 0
                      <TextHeading className='text-2xl'>${formatAmount(hover)}</TextHeading>
                    ) : (
                      <>
                        {properties && (
                          <TextHeading className={cn('text-2xl')}>${formatAmount(valueDefault)}</TextHeading>
                        )}
                      </>
                    )}
                  </>
                  {dateHover ? <TextSubHeading>{dateHover}</TextSubHeading> : <div className='h-5' />}
                </div>
              )}
            </div>

            {properties && (
              <Selection
                className={cn('items-stretch md:h-11', !isExpanded && 'h-8! bg-transparent')}
                classNames={{
                  items: cn('md:text-sm! text-xs py-2! px-3!', !isExpanded && 'text-xs! h-6! py-1! px-2!'),
                }}
                data={periods}
              />
            )}
          </div>
        )}
      </div>
      <div className={cn('mt-2 h-[250px]', !properties && 'h-[292px]')}>
        <AnalyticsReChart
          data={formattedData}
          setHoverValue={setHover}
          setHoverDate={setDateHover}
          xAsisKey={groupPerEpoch ? 'epoch' : 'time'}
          chartConfig={property === 'all' ? chartConfig : pick(chartConfig, [property])}
          chartItemConfigs={
            property === 'all' ? chartItemConfigs : chartItemConfigs.filter(item => item.dataKey === property)
          }
          useEpoch={groupPerEpoch}
          chartType={chartType}
        />
      </div>
      {!!epochData?.length && isMinimum && (
        <div className='w-full'>
          <Toggle
            className='mx-auto w-fit'
            checked={groupPerEpoch}
            onChange={() => setGroupPerEpoch(!groupPerEpoch)}
            toggleId={`active-epoch-${chartId}`}
            label='Per Epoch'
          />
        </div>
      )}
    </Box>
  )
}

export default memo(AnalyticsChart)
