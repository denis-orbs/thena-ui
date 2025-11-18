import dayjs from 'dayjs'
import { pick } from 'lodash'
import { useTranslations } from 'next-intl'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

import Toggle from '@/components/toggle'
import cn from '@/utils/classes'
import { formatAmount } from '@/utils/utils'

import Expand06Icon from '~/svgs/expand-06.svg'

import AnalyticsReChart from './AnalyticsReChart'
import Box from '../box'
import { TextIconButton } from '../buttons/IconButton'
import Divider from '../divider'
import Selection from '../selection'
import Skeleton from '../skeleton'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'

/** Base on HoverableChart and can support stacked bar chart and group data by epoch */

function AnalyticsChart({
  epochData,
  rawData,
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
  defaultValue,
  xAxisLine = false,
  defaultProperty = 'all',
  isLoading = false,
}) {
  const [groupPerEpoch, setGroupPerEpoch] = useState(false)
  const [property, setProperty] = useState(defaultProperty)
  const [period, setPeriod] = useState(1)
  const [hover, setHover] = useState()
  const [dateHover, setDateHover] = useState()
  const t = useTranslations()

  useEffect(() => {
    setProperty(prev => (prev === 'all' ? prev : defaultProperty))
  }, [defaultProperty])

  const chartData = useMemo(() => (groupPerEpoch ? epochData : rawData), [rawData, groupPerEpoch, epochData])
  useEffect(() => {
    if (!onHoverChange) return
    if (hover === undefined) {
      onHoverChange(defaultValue ?? 0)
      return
    }
    onHoverChange(hover)
  }, [hover, onHoverChange, defaultValue])

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
  const filteredChartItemConfigs = useMemo(() => {
    if (property !== 'all') {
      return chartItemConfigs.filter(item => item.dataKey === property)
    }
    if (!groupPerEpoch) {
      return chartItemConfigs.filter(config => !config.onlyShowByEpoch)
    }

    return chartItemConfigs
  }, [property, groupPerEpoch, chartItemConfigs])

  const filteredProperties = useMemo(() => {
    if (!groupPerEpoch) {
      return Object.fromEntries(Object.entries(chartConfig).filter(([_, config]) => !config.onlyShowByEpoch))
    }
    return chartConfig
  }, [groupPerEpoch, chartConfig])

  useEffect(() => {
    const activeConfig = chartItemConfigs.find(item => item.dataKey === property)
    if (!groupPerEpoch && activeConfig?.onlyShowByEpoch) {
      setProperty('all')
    }
  }, [chartItemConfigs, groupPerEpoch, property])

  const properties = useMemo(
    () =>
      Object.keys(filteredProperties).length > 1
        ? [
            ...Object.keys(filteredProperties).map(key => ({
              label: filteredProperties[key].label ?? '',
              active: property === key,
              onClickHandler: () => {
                setProperty(key)
              },
            })),
            {
              label: 'All',
              active: property === 'all',
              onClickHandler: () => {
                setProperty('all')
              },
            },
          ]
        : null,
    [property, filteredProperties],
  )

  // Calculate current price for stacked charts
  const currentPrice = useMemo(() => {
    if (!formattedData?.length || !chartItemConfigs?.length) return 0

    const lastDataPoint = formattedData[formattedData.length - 1]
    const activeConfigs =
      property === 'all' ? chartItemConfigs : chartItemConfigs.filter(item => item.dataKey === property)

    // For stacked charts (multiple data keys), sum all values
    if (activeConfigs.length > 1) {
      return (
        activeConfigs.reduce(
          (sum, config) =>
            sum +
            (!groupPerEpoch
              ? config.onlyShowByEpoch
                ? 0
                : lastDataPoint[config.dataKey] || 0
              : lastDataPoint[config.dataKey] || 0),
          0,
        ) || 0
      )
    }

    // For single data key, use the value directly
    return lastDataPoint[activeConfigs[0]?.dataKey] ?? 0
  }, [formattedData, chartItemConfigs, property, groupPerEpoch])

  const chartTooltipFormatter = useCallback(
    (value, name, entry) => {
      let label = ''
      switch (name) {
        case 'tvlUSD':
          label = t('TVL')
          break
        case 'volumeUSD':
          label = t('Volume (24h)')
          break
        case 'veTheUSD':
          label = t('veTHE')
          break
        case 'customPoolFeesUSD':
          label = t('LP')
          break
        case 'theNftUSD':
          label = t('theNFT')
          break
        case 'bribeUSD':
          label = t('Incentives')
          break
        case 'vaultSingleSideFeesUSD':
          label = t('THE Single Sided Vaults')
          break
        default:
          break
      }

      return (
        <div className='flex items-center gap-2'>
          <div className='size-2.5 rounded-[2px]' style={{ backgroundColor: entry?.color || entry?.fill }} />
          <Paragraph className='text-xs! font-normal text-neutral-50'>
            {`${label} $${formatAmount(value, true)}`}
          </Paragraph>
        </div>
      )
    },
    [t],
  )

  return (
    <Box className={cn('bg-chart-gradient border border-[#422D4C]', (isMinimum || !isExpanded) && 'p-4!', className)}>
      <div className={cn('flex flex-col gap-3', (!isExpanded || isMinimum) && 'gap-1')}>
        <div className={cn('flex justify-between', !isExpanded && 'flex-col gap-1')}>
          {isMinimum ? (
            <>
              {properties && (
                <Selection
                  className={cn(
                    'mt-1 w-full items-start justify-start overflow-x-auto bg-transparent max-[356px]:max-w-[356px] max-sm:px-0',
                  )}
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
                {Number(hover) > -1 && typeof hover !== 'undefined' ? (
                  <Paragraph
                    className={cn(
                      'text-base font-semibold text-neutral-50 lg:text-3xl',
                      isExpanded && 'text-3xl! leading-9!',
                      classNames?.title,
                    )}
                  >
                    {t(title)}
                  </Paragraph>
                ) : (
                  <Paragraph className={cn('text-base font-semibold text-neutral-50 lg:text-3xl', classNames?.title)}>
                    {t(defaultDateHover ?? title)}
                  </Paragraph>
                )}
                {!!epochData?.length && isExpanded && (
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
                    Icon={Expand06Icon}
                    className='h-6! w-6! stroke-neutral-400 p-1!'
                    onClick={() => {
                      onExpand()
                    }}
                  />
                )}
              </div>
              <div className='flex min-h-8 items-start justify-between gap-1'>
                {!isExpanded && (
                  <div className='flex h-6 flex-row gap-2'>
                    {Number(hover) > -1 && typeof hover !== 'undefined' ? ( // sometimes data is 0
                      <TextHeading className={cn('font-archia text-xl! leading-6! font-semibold')}>
                        ${formatAmount(hover)}
                      </TextHeading>
                    ) : (
                      <>
                        <TextHeading className={cn('font-archia text-xl! leading-6! font-semibold')}>
                          ${formatAmount(defaultValue)}
                        </TextHeading>
                      </>
                    )}
                    {dateHover ? (
                      <TextSubHeading className='text-xs! leading-4! font-medium'>{dateHover}</TextSubHeading>
                    ) : (
                      <div className='h-5' />
                    )}
                  </div>
                )}
                {properties && (
                  <Selection
                    className={cn(
                      'items-stretch overflow-x-auto bg-transparent max-sm:px-0 md:h-11',
                      !isExpanded && 'h-8!',
                      !!epochData?.length && isExpanded && 'mt-9',
                    )}
                    classNames={{
                      items: cn(
                        'md:text-sm text-x! flex-1 w-fit text-nowrap',
                        !isExpanded && 'text-xs! h-6! py-1! px-2!',
                      ),
                    }}
                    data={properties}
                  />
                )}
              </div>
            </>
          )}
        </div>
        <Divider className={cn(!properties && 'hidden md:block')} />
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
                <div className='flex h-[56px] flex-col gap-1'>
                  <>
                    {Number(hover) > -1 && typeof hover !== 'undefined' ? ( // sometimes data is 0
                      <TextHeading className='text-3xl! leading-9!'>${formatAmount(hover)}</TextHeading>
                    ) : (
                      <TextHeading className={cn('text-3xl! leading-9!')}>${formatAmount(defaultValue)}</TextHeading>
                    )}
                  </>
                  {dateHover ? <TextSubHeading>{dateHover}</TextSubHeading> : <div className='h-5' />}
                </div>
              )}
            </div>

            <div className={cn('flex items-center justify-between gap-1', !isExpanded && 'w-full')}>
              <div>
                {!!epochData?.length && !isExpanded && (
                  <Toggle
                    className='hidden lg:flex'
                    checked={groupPerEpoch}
                    onChange={() => setGroupPerEpoch(!groupPerEpoch)}
                    toggleId={`active-epoch-${chartId}`}
                    label='Per Epoch'
                  />
                )}
              </div>
              <Selection
                className={cn('items-center bg-transparent md:h-11!', !isExpanded && 'h-8!')}
                classNames={{
                  items: cn('md:text-sm text-xs py-2! px-3!', !isExpanded && 'text-xs! h-6! py-1! px-2!'),
                }}
                data={periods}
              />
            </div>
          </div>
        )}
      </div>
      <div className='mt-6 h-[250px]'>
        {isLoading ? (
          <Skeleton className='h-full w-full' />
        ) : (
          <AnalyticsReChart
            data={formattedData}
            setHoverValue={setHover}
            setHoverDate={setDateHover}
            xAsisKey={groupPerEpoch ? 'epoch' : 'time'}
            chartConfig={property === 'all' ? chartConfig : pick(chartConfig, [property])}
            chartItemConfigs={filteredChartItemConfigs}
            useEpoch={groupPerEpoch}
            chartType={chartType}
            currentPrice={currentPrice}
            showCurrentPrice
            chartTooltipFormatter={chartTooltipFormatter}
            desiredTicks={isMinimum || !isExpanded ? 4 : 12}
            xAxisLine={xAxisLine}
            showTooltip={Boolean(properties)}
          />
        )}
      </div>
      {!!epochData?.length && isMinimum && (
        <div className='mt-4 w-full'>
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
