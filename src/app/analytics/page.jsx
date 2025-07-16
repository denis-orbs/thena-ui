'use client'

import { groupBy } from 'lodash'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import PercentBadge from '@/components/badges/PercentBadge'
import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import BarChart from '@/components/charts/BarChart'
import EpochStackableChart from '@/components/charts/EpochStackableChart'
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

  const { pairs } = usePairs()
  const { push } = useRouter()
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
          <div className='grid grid-cols-1 gap-6'>
            <EpochStackableChart
              groupEpochData={groupEpochData}
              rawData={rawData}
              title='Fee Distribution'
              valueProperty={['feesUSD', 'customPoolFeesUSD']}
              ChartComponent={StackableBarChart}
              chartId='Fee Distribution'
              propertyLabel={{
                feesUSD: t('veTHE owners'),
                customPoolFeesUSD: t("Manual LP'ers"),
              }}
            />
          </div>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <EpochStackableChart
              groupEpochData={groupEpochData}
              rawData={rawData}
              protocolData={totalStats}
              valueProperty='tvlUSD'
              title='TVL'
              chartId='tvlUSD'
              ChartComponent={LineChart}
            />
            <EpochStackableChart
              groupEpochData={groupEpochData}
              rawData={rawData}
              protocolData={totalStats}
              valueProperty='volumeUSD'
              chartId='volumeUSD'
              title='Volume (24h)'
              ChartComponent={BarChart}
            />
          </div>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            <Box className='flex flex-col gap-2'>
              <div className='flex items-start justify-between'>
                {totalStats ? (
                  <>
                    <TextHeading className='text-2xl'>${formatAmount(totalStats.tvlUSD)}</TextHeading>
                    <PercentBadge value={totalStats.tvlChange} />
                  </>
                ) : (
                  <>
                    <Skeleton className='h-[32px] w-[160px]' />
                    <Skeleton className='h-[24px] w-[80px]' />
                  </>
                )}
              </div>
              <Paragraph className='text-sm'>{t('TVL')}</Paragraph>
            </Box>
            <Box className='flex flex-col gap-2'>
              <div className='flex items-start justify-between'>
                {totalStats ? (
                  <>
                    <TextHeading className='text-2xl'>${formatAmount(totalStats.volumeUSD)}</TextHeading>
                    <PercentBadge value={totalStats.volumeChange} />
                  </>
                ) : (
                  <>
                    <Skeleton className='h-[32px] w-[160px]' />
                    <Skeleton className='h-[24px] w-[80px]' />
                  </>
                )}
              </div>
              <Paragraph className='text-sm'>{t('Volume (24h)')}</Paragraph>
            </Box>
            <Box className='flex flex-col gap-2'>
              <div className='flex items-start justify-between'>
                {totalStats ? (
                  <>
                    <TextHeading className='text-2xl'>${formatAmount(totalStats.feesUSD)}</TextHeading>
                    <PercentBadge value={totalStats.feesChange} />
                  </>
                ) : (
                  <>
                    <Skeleton className='h-[32px] w-[160px]' />
                    <Skeleton className='h-[24px] w-[80px]' />
                  </>
                )}
              </div>
              <Paragraph className='text-sm'>{t('Fees (24h)')}</Paragraph>
            </Box>
          </div>
        </div>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <TextHeading>{t('Top Assets')}</TextHeading>
            <EmphasisButton
              onClick={() => {
                push('/analytics/tokens?back=3')
              }}
            >
              {t('View All')}
            </EmphasisButton>
          </div>
          <TokensTable backUrlNumber={3} data={tokens} hidePagination />
        </div>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <TextHeading>{t('Top Pairs')}</TextHeading>
            <EmphasisButton
              onClick={() => {
                push('/analytics/pairs?back=3')
              }}
            >
              {t('View All')}
            </EmphasisButton>
          </div>
          <PairsTable backUrlNumber={3} data={pairs} hidePagination />
        </div>
      </div>
    </LayoutWithBackButton>
  )
}
