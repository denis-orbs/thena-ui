'use client'

import { groupBy } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import PercentBadge from '@/components/badges/PercentBadge'
import AnalyticsChart from '@/components/charts/AnalyticsChart'
import SingleBarReChart from '@/components/charts/SingleBarReChart'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading } from '@/components/typography'
import { usePairs } from '@/context/pairsContext'
import { useTokens } from '@/context/tokensContext'
import { useAnalyticsChartData } from '@/hooks/useGraph'
import { fetchStats } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import PairsTable from './pairs/PairsTable'
import TokensTable from './tokens/TokensTable'

export default function AnalyticsPage() {
  const { networkId } = useChainSettings()
  const [isExpanded, setIsExpanded] = useState('feeDistribution')

  const { pairs } = usePairs()
  // const { push } = useRouter()
  const { tokens } = useTokens()
  const t = useTranslations()
  const { data: stats } = useSWR(
    'stats api',
    { fetcher: fetchStats },
    {
      refreshInterval: 60000,
    },
  )
  const rawData = useAnalyticsChartData()
  const groupEpochData = useMemo(() => {
    const groupData = groupBy(rawData ?? [], 'epoch')
    const result = {}

    for (let i = 0; i < Object.keys(groupData).length; i++) {
      const items = groupData[Object.keys(groupData)[i]]
      result[Object.keys(groupData)[i]] = items.reduce(
        (prevVal, curr) => ({
          ...prevVal,
          customPoolFeesUSD: prevVal.customPoolFeesUSD + curr.customPoolFeesUSD,
          feesUSD: prevVal.feesUSD + curr.feesUSD + prevVal.customPoolFeesUSD + curr.customPoolFeesUSD,
          totalFeesUSD: prevVal.feesUSD + curr.feesUSD,
          tvlUSD: prevVal.tvlUSD + curr.tvlUSD,
          volumeUSD: prevVal.volumeUSD + curr.volumeUSD,
          date: !prevVal.date ? curr.date : Math.min(curr.date, prevVal.date),
        }),
        {
          chainId: networkId,
          epoch: Number(Object.keys(groupData)[i]),
          customPoolFeesUSD: 0,
          feesUSD: 0,
          totalFeesUSD: 0,
          tvlUSD: 0,
          volumeUSD: 0,
          date: 0,
        },
      )
    }
    return Object.values(result).map(item => ({
      ...item,
      customPoolFeesUSD: item.customPoolFeesUSD * 100,
    }))
  }, [rawData, networkId])

  const totalStats = useMemo(() => {
    if (!stats) return undefined

    if (networkId === ChainId.BSC) {
      return stats.find(ele => ele.type === 'bsc-total')
    }
    return stats.find(ele => ele.type === 'op-total')
  }, [networkId, stats])

  return (
    <LayoutWithBackButton
      hiddenBackButton
      className='3xl:w-[1464px] 3xl:pt-8! pt-6! xl:mx-12 2xl:mx-auto 2xl:w-[1344px]'
    >
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <h2>{t('Analytics')}</h2>
          <div className='lg:bg-chart-gradient item-center flex gap-8 px-8 py-4 lg:justify-between lg:rounded-xl lg:border lg:border-[#422D4C]'>
            <div className='bg-chart-gradient flex flex-col gap-2 rounded-xl border border-[#422D4C] py-4 lg:border-0 lg:bg-none'>
              <div className='flex items-start justify-between gap-4'>
                {totalStats ? (
                  <>
                    <TextHeading className='text-gradient-pink text-3xl'>
                      ${formatAmount(totalStats.tvlUSD)}
                    </TextHeading>
                    <PercentBadge value={totalStats.tvlChange} />
                  </>
                ) : (
                  <>
                    <Skeleton className='h-[32px] w-[160px]' />
                    <Skeleton className='h-[24px] w-[80px]' />
                  </>
                )}
              </div>
              <Paragraph className='text-sm text-neutral-500'>{t('TVL')}</Paragraph>
            </div>
            <div className='bg-chart-gradient flex flex-col gap-2 rounded-xl border border-[#422D4C] py-4 lg:border-0 lg:bg-none'>
              <div className='flex items-start justify-between gap-4'>
                {totalStats ? (
                  <>
                    <TextHeading className='text-gradient-pink text-3xl'>
                      ${formatAmount(totalStats.volumeUSD)}
                    </TextHeading>
                    <PercentBadge value={totalStats.volumeChange} />
                  </>
                ) : (
                  <>
                    <Skeleton className='h-[32px] w-[160px]' />
                    <Skeleton className='h-[24px] w-[80px]' />
                  </>
                )}
              </div>
              <Paragraph className='text-sm text-neutral-500'>{t('Volume (24h)')}</Paragraph>
            </div>
            <div className='bg-chart-gradient flex flex-col gap-2 rounded-xl border border-[#422D4C] py-4 lg:border-0 lg:bg-none'>
              <div className='flex items-start justify-between gap-4'>
                {totalStats ? (
                  <>
                    <TextHeading className='text-gradient-pink text-3xl'>
                      ${formatAmount(totalStats.feesUSD)}
                    </TextHeading>
                    <PercentBadge value={totalStats.feesChange} />
                  </>
                ) : (
                  <>
                    <Skeleton className='h-[32px] w-[160px]' />
                    <Skeleton className='h-[24px] w-[80px]' />
                  </>
                )}
              </div>
              <Paragraph className='text-sm text-neutral-500'>{t('Fees (24h)')}</Paragraph>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-6'>
            {isExpanded === 'feeDistribution' && (
              <AnalyticsChart
                epochData={groupEpochData}
                defaultDateHover='Total Revenue'
                rawData={rawData}
                title='Fee'
                protocolData={totalStats}
                protocolProperty='revenueData'
                chartId='Fee Distribution'
                chartConfig={{
                  feesUSD: {
                    label: t('veTHE owners'),
                  },
                  customPoolFeesUSD: {
                    label: t("Manual LP'ers"),
                  },
                }}
                chartItemConfigs={[
                  {
                    dataKey: 'customPoolFeesUSD',
                    fill: '#BD60BA',
                    stroke: '#EA66E5',
                    strokeWidth: 2,
                    shape: SingleBarReChart,
                  },
                  {
                    dataKey: 'feesUSD',
                    fill: '#F199EE',
                    stroke: '#F199EE',
                    shape: SingleBarReChart,
                  },
                ]}
                isExpanded
              />
            )}
            {isExpanded === 'tvl' && (
              <AnalyticsChart
                className='bg-chart-gradient rounded-xl border border-[#422D4C]'
                classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia' }}
                rawData={rawData}
                title='TVL'
                protocolData={totalStats}
                protocolProperty='tvlUSD'
                chartId='tvlUSD'
                chartConfig={{
                  tvlUSD: {
                    label: t('Total Volume'),
                  },
                }}
                chartItemConfigs={[
                  {
                    dataKey: 'tvlUSD',
                    fill: 'url(#fillGradient)',
                    stroke: '#F299EE',
                  },
                ]}
                chartType='area'
                isExpanded
              />
            )}
            {isExpanded === 'volume' && (
              <AnalyticsChart
                className='bg-chart-gradient rounded-xl border border-[#422D4C]'
                rawData={rawData}
                title='Volume (24h)'
                protocolData={totalStats}
                protocolProperty='volumeUSD'
                chartId='Volume (24h)'
                chartConfig={{
                  volumeUSD: {
                    label: t('Volume (24h)'),
                  },
                }}
                chartItemConfigs={[
                  {
                    dataKey: 'volumeUSD',
                    fill: 'url(#fillGradient)',
                    stroke: '#F299EE',
                    shape: SingleBarReChart,
                  },
                ]}
                isExpanded
              />
            )}
          </div>
          <div className='lg:bg-chart-gradient grid grid-cols-1 gap-6 rounded-xl bg-none lg:grid-cols-2'>
            {isExpanded === 'tvl' ? (
              <AnalyticsChart
                rawData={rawData}
                className='bg-chart-gradient border border-[#422D4C] bg-transparent lg:bg-none'
                classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia' }}
                title='Fee'
                protocolData={totalStats}
                protocolProperty='revenueData'
                chartId='Fee Distribution'
                chartConfig={{
                  feesUSD: {
                    label: t('veTHE owners'),
                  },
                  customPoolFeesUSD: {
                    label: t("Manual LP'ers"),
                  },
                }}
                chartItemConfigs={[
                  {
                    dataKey: 'customPoolFeesUSD',
                    fill: '#BD60BA',
                    stroke: '#EA66E5',
                    strokeWidth: 2,
                    shape: SingleBarReChart,
                  },
                  {
                    dataKey: 'feesUSD',
                    fill: '#F199EE',
                    stroke: '#F199EE',
                    shape: SingleBarReChart,
                  },
                ]}
                showPerEpoch={false}
                isExpanded={false}
                onExpand={() => setIsExpanded('feeDistribution')}
              />
            ) : (
              <AnalyticsChart
                className='bg-chart-gradient border border-[#422D4C] bg-transparent lg:bg-none'
                classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia' }}
                rawData={rawData}
                title='TVL'
                protocolData={totalStats}
                protocolProperty='tvlUSD'
                chartId='tvlUSD'
                chartConfig={{
                  tvlUSD: {
                    label: t('Total Volume'),
                  },
                }}
                chartItemConfigs={[
                  {
                    dataKey: 'tvlUSD',
                    fill: 'url(#fillGradient)',
                    stroke: '#F299EE',
                  },
                ]}
                chartType='area'
                isExpanded={false}
                onExpand={() => setIsExpanded('tvl')}
              />
            )}
            {isExpanded === 'volume' ? (
              <AnalyticsChart
                rawData={rawData}
                classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia' }}
                title='Fee'
                protocolData={totalStats}
                protocolProperty='revenueData'
                chartId='Fee Distribution'
                chartConfig={{
                  feesUSD: {
                    label: t('veTHE owners'),
                  },
                  customPoolFeesUSD: {
                    label: t("Manual LP'ers"),
                  },
                }}
                chartItemConfigs={[
                  {
                    dataKey: 'customPoolFeesUSD',
                    fill: '#BD60BA',
                    stroke: '#EA66E5',
                    strokeWidth: 2,
                    shape: SingleBarReChart,
                  },
                  {
                    dataKey: 'feesUSD',
                    fill: '#F199EE',
                    stroke: '#F199EE',
                    shape: SingleBarReChart,
                  },
                ]}
                isExpanded={false}
                onExpand={() => setIsExpanded('feeDistribution')}
              />
            ) : (
              <AnalyticsChart
                classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia' }}
                rawData={rawData}
                title='Volume (24h)'
                protocolData={totalStats}
                protocolProperty='volumeUSD'
                chartId='Volume (24h)'
                chartConfig={{
                  volumeUSD: {
                    label: t('Volume (24h)'),
                  },
                }}
                chartItemConfigs={[
                  {
                    dataKey: 'volumeUSD',
                    fill: 'url(#fillGradient)',
                    stroke: '#F299EE',
                    shape: SingleBarReChart,
                  },
                ]}
                onExpand={() => setIsExpanded('volume')}
                isExpanded={false}
              />
            )}
          </div>
        </div>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <TextHeading className='text-2xl text-neutral-50'>{t('Top Assets')}</TextHeading>
            {/* <EmphasisButton
              onClick={() => {
                push('/analytics/tokens?back=3')
              }}
            >
              {t('View All')}
            </EmphasisButton> */}
          </div>
          <TokensTable backUrlNumber={3} data={tokens} />
        </div>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <TextHeading className='text-2xl text-neutral-50'>{t('Top Pairs')}</TextHeading>
            {/* <EmphasisButton
              onClick={() => {
                push('/analytics/pairs?back=3')
              }}
            >
              {t('View All')}
            </EmphasisButton> */}
          </div>
          <PairsTable backUrlNumber={3} data={pairs} />
        </div>
      </div>
    </LayoutWithBackButton>
  )
}
