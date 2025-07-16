'use client'

import { groupBy } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import PercentBadge from '@/components/badges/PercentBadge'
import BarChart from '@/components/charts/BarChart'
import EpochStackableChart from '@/components/charts/EpochStackableChart'
import HoverableChart from '@/components/charts/HoverableChart'
import LineChart from '@/components/charts/LineChart'
import StackableBarChart from '@/components/charts/StackableBarChart'
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
    return Object.values(result)
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
              <EpochStackableChart
                groupEpochData={groupEpochData}
                rawData={rawData}
                title='Fee'
                protocolData={totalStats}
                valueProperty={['feesUSD', 'customPoolFeesUSD']}
                protocolProperty='feesUSD'
                ChartComponent={StackableBarChart}
                chartId='Fee Distribution'
                propertyLabel={{
                  feesUSD: t('veTHE owners'),
                  customPoolFeesUSD: t("Manual LP'ers"),
                }}
                isExpanded
              />
            )}
            {isExpanded === 'tvl' && (
              <HoverableChart
                className='bg-chart-gradient rounded-xl border border-[#422D4C]'
                chartData={rawData}
                protocolData={totalStats}
                valueProperty='tvlUSD'
                title='TVL'
                ChartComponent={LineChart}
                isExpanded
              />
            )}
            {isExpanded === 'volume' && (
              <HoverableChart
                className='bg-chart-gradient rounded-xl border border-[#422D4C]'
                chartData={rawData ? rawData.slice(0, rawData.length - 1) : undefined}
                protocolData={totalStats}
                valueProperty='volumeUSD'
                title='Volume (24h)'
                ChartComponent={BarChart}
                isExpanded
              />
            )}
          </div>
          <div className='lg:bg-chart-gradient grid grid-cols-1 gap-6 rounded-xl bg-none lg:grid-cols-2'>
            {isExpanded === 'tvl' ? (
              <EpochStackableChart
                groupEpochData={groupEpochData}
                rawData={rawData}
                title='Fee Distribution'
                protocolData={totalStats}
                valueProperty={['feesUSD', 'customPoolFeesUSD']}
                protocolProperty='feesUSD'
                ChartComponent={StackableBarChart}
                chartId='Fee Distribution'
                propertyLabel={{
                  feesUSD: t('veTHE owners'),
                  customPoolFeesUSD: t("Manual LP'ers"),
                }}
                classNames={{ title: 'text-xl! leading-6! text-neutral-500' }}
                showPerEpoch={false}
                isExpanded={false}
                onExpand={() => setIsExpanded('feeDistribution')}
              />
            ) : (
              <HoverableChart
                className='bg-chart-gradient border border-[#422D4C] bg-transparent lg:bg-none'
                chartData={rawData}
                protocolData={totalStats}
                valueProperty='tvlUSD'
                title='TVL'
                ChartComponent={LineChart}
                onExpand={() => setIsExpanded('tvl')}
                isExpanded={false}
                classNames={{ title: 'font-semibold font-archia' }}
              />
            )}
            {isExpanded === 'volume' ? (
              <EpochStackableChart
                groupEpochData={groupEpochData}
                rawData={rawData}
                title='Fee Distribution'
                protocolData={totalStats}
                valueProperty={['feesUSD', 'customPoolFeesUSD']}
                protocolProperty='feesUSD'
                ChartComponent={StackableBarChart}
                chartId='Fee Distribution'
                propertyLabel={{
                  feesUSD: t('veTHE owners'),
                  customPoolFeesUSD: t("Manual LP'ers"),
                }}
                classNames={{ title: 'lg:text-xl! leading-6! text-neutral-500' }}
                showPerEpoch={false}
                isExpanded={false}
                onExpand={() => setIsExpanded('feeDistribution')}
              />
            ) : (
              <HoverableChart
                className='bg-chart-gradient border border-[#422D4C] bg-transparent lg:bg-none'
                chartData={rawData ? rawData.slice(0, rawData.length - 1) : undefined}
                protocolData={totalStats}
                valueProperty='volumeUSD'
                title='Volume (24h)'
                ChartComponent={BarChart}
                onExpand={() => setIsExpanded('volume')}
                isExpanded={false}
                classNames={{ title: 'font-semibold font-archia' }}
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
