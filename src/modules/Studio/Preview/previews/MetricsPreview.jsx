import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import { TextHeading } from '@/components/typography'
import usePrices from '@/hooks/usePrices'
import { fetchStats } from '@/lib/subgraph'
import { cn, formatAmount } from '@/lib/utils'

import EmptyShow from './EmptyShow'

const TITLE_SIZES = {
  sm: 'text-xl leading-[31px]',
  md: 'text-2xl leading-[31px]',
  lg: 'text-2xl leading-[31px]',
  xl: 'text-[28px] leading-[31px]',
  '2xl': 'text-4xl leading-10',
}

const VALUE_SIZES = {
  sm: 'text-[52px] leading-[67px]',
  md: 'text-[68px] leading-[83px]',
  lg: 'text-[64px] leading-[67px]',
  xl: 'text-[96px] leading-[110px]',
  '2xl': 'text-[164px] leading-[170px]',
}

function NumberInfo({ title, value, size = 'sm', colorClass = '#D642DB', prefix = '$', className }) {
  const t = useTranslations()

  return (
    <div className={cn('flex flex-col justify-center gap-1 text-center', className)}>
      <TextHeading className={cn('font-semibold', TITLE_SIZES[size])}>{t(title)}</TextHeading>

      <TextHeading className={cn('font-archia font-semibold', VALUE_SIZES[size])} style={{ color: colorClass }}>
        {prefix}
        {formatAmount(value, true)}
      </TextHeading>
    </div>
  )
}

function MetricsPreview({ state }) {
  const t = useTranslations()
  const { metricsShow } = state
  const { data: statsData } = useSWR('thena total stats', () => fetchStats())
  const prices = usePrices()

  const size = useMemo(() => {
    switch (metricsShow?.length) {
      case 1:
        return '2xl'
      case 2:
        return 'xl'
      case 3:
        return 'lg'
      case 4:
      case 5:
      case 6:
        return 'sm'
      default:
        return 'sm'
    }
  }, [metricsShow])

  const renderMetrics = useCallback(
    (key, metric) => {
      switch (metric) {
        case 'Total Value Locked':
          return (
            <NumberInfo size={size} className='flex-1' key={key} title='Total Value Locked' value={statsData?.tvl} />
          )
        case 'Total Volume':
          return (
            <NumberInfo size={size} className='flex-1' key={key} title='Total Volume' value={statsData?.totalVolume} />
          )
        case 'Total Revenue':
          return (
            <NumberInfo size={size} className='flex-1' key={key} title='Total Revenue' value={statsData?.revenueData} />
          )
        case 'Total Trading Fees':
          return (
            <NumberInfo
              size={size}
              className='flex-1'
              key={key}
              title='Total Trading Fees'
              value={statsData?.totalFeesUSD}
            />
          )
        case 'THENA Market Cap':
          return (
            <NumberInfo
              size={size}
              className='flex-1'
              key={key}
              title='THENA Market Cap'
              value={statsData?.marketCap}
            />
          )
        case '$THE Price':
          return <NumberInfo size={size} className='flex-1' key={key} title='$THE Price' value={prices.THE} />
        case 'Last Epoch Revenue':
          return (
            <NumberInfo
              size={size}
              className='flex-1'
              key={key}
              title='Last Epoch Revenue'
              value={statsData?.lastEpochRevenueUSD}
            />
          )
        case '24h Volume':
          return <NumberInfo size={size} className='flex-1' key={key} title='24h Volume' value={statsData?.volumeUSD} />
        case '24h Fees':
          return <NumberInfo size={size} className='flex-1' key={key} title='24h Fees' value={statsData?.feesUSD} />
        default:
          return ''
      }
    },
    [
      prices.THE,
      size,
      statsData?.feesUSD,
      statsData?.lastEpochRevenueUSD,
      statsData?.marketCap,
      statsData?.revenueData,
      statsData?.totalFeesUSD,
      statsData?.totalVolume,
      statsData?.tvl,
      statsData?.volumeUSD,
    ],
  )

  if (!Array.isArray(metricsShow) || metricsShow?.length === 0) {
    return (
      <EmptyShow title='Select On-Chain Metric' subTitle='Select on-chain metric from the list to see the results' />
    )
  }

  return (
    <div className={cn('flex w-full flex-col gap-[110px] px-10 py-9', metricsShow.length > 3 && 'gap-[88px]')}>
      <TextHeading className='font-archia mx-auto text-[64px] leading-[70px] font-semibold'>
        {t('THENA in Numbers')}
      </TextHeading>
      <div className='flex w-full flex-wrap justify-center gap-x-px gap-y-[68px]'>
        <div className='flex w-full justify-center gap-x-px'>
          {metricsShow.slice(0, 3).map((metric, index) => renderMetrics(index, metric))}
        </div>
        <div className='flex justify-center gap-x-px'>
          {metricsShow.slice(3).map((metric, index) => renderMetrics(index, metric))}
        </div>
      </div>
    </div>
  )
}

export default MetricsPreview
