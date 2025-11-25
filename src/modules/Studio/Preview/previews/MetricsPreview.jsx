import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import { TextHeading } from '@/components/typography'
import { useEpochTimer } from '@/hooks/useGeneral'
import usePrices from '@/hooks/usePrices'
import { fetchStats } from '@/lib/subgraph'
import cn from '@/utils/classes'
import { formatAmount } from '@/utils/utils'

import EmptyShow from './EmptyShow'
import { METRICS_TYPE } from '../../lib/utils'

const TITLE_SIZES = {
  sm: 'text-xl leading-[31px]',
  md: 'text-2xl leading-[31px]',
  lg: 'text-2xl leading-[31px]',
  xl: 'text-[28px] leading-[31px]',
  '2xl': 'text-4xl leading-10',
}

const VALUE_SIZES = {
  sm: 'text-[56px] leading-[62px]',
  md: 'text-[54px] leading-[65px]',
  lg: 'text-[56px] leading-[62px]',
  xl: 'text-[82px] leading-[90px]',
  '2xl': 'text-[138px] leading-[145px]',
}

function NumberInfo({ title, value, size = 'sm', colorClass = '#D642DB', prefix = '$', keyTranslate, className }) {
  const t = useTranslations()

  return (
    <div
      className={cn(
        'flex min-w-[314px] flex-col justify-center gap-1 text-center',
        (size === 'sm' || size === 'md') && 'max-w-[314px]',
        size === 'md' && 'max-w-[472px]',
        className,
      )}
    >
      <TextHeading className={cn('font-semibold', TITLE_SIZES[size])}>{t(title, keyTranslate)}</TextHeading>

      <TextHeading className={cn('font-archia font-semibold', VALUE_SIZES[size])} style={{ color: colorClass }}>
        {prefix}
        {formatAmount(value, true)}
      </TextHeading>
    </div>
  )
}

function MetricsPreview({ state }) {
  const t = useTranslations()
  const { metricsShow, metricsType } = state
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
        return 'md'
      case 5:
      case 6:
        return 'sm'
      default:
        return 'sm'
    }
  }, [metricsShow])

  const { epoch } = useEpochTimer()

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
              title='Epoch [number] Revenue'
              keyTranslate={{ number: epoch - 1 }}
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
      epoch,
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
    <div
      className={cn(
        'flex h-full w-full flex-col gap-[65px] px-10 py-6',
        metricsShow.length === 2 && 'gap-[84px]',
        metricsShow.length === 3 && 'gap-[115px]',
        metricsShow.length === 4 && 'gap-[44px]',
        metricsShow.length === 5 && 'gap-[62px]',
        metricsShow.length === 6 && 'gap-[60px]',
      )}
    >
      <TextHeading className='font-archia mx-auto text-[54px] leading-[70px] font-semibold tracking-[-1px]'>
        {t(metricsType === METRICS_TYPE.KEY_METRICS ? 'THENA in Numbers' : 'THENA Recent Activity')}
      </TextHeading>
      <div
        className={cn(
          'flex w-full flex-wrap justify-center gap-x-px gap-y-6 pt-4',
          metricsShow.length === 4 && 'gap-y-6',
        )}
      >
        <div className='flex w-full justify-center gap-x-px'>
          {metricsShow.slice(0, metricsShow.length !== 4 ? 3 : 2).map((metric, index) => renderMetrics(index, metric))}
        </div>
        {metricsShow.length > 3 && (
          <div className='flex w-full justify-center gap-x-px'>
            {metricsShow.slice(metricsShow.length !== 4 ? 3 : 2).map((metric, index) => renderMetrics(index, metric))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricsPreview
