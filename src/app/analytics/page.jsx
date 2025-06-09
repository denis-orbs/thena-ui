'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import PercentBadge from '@/components/badges/PercentBadge'
import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import BarChart from '@/components/charts/BarChart'
import HoverableChart from '@/components/charts/HoverableChart'
import LineChart from '@/components/charts/LineChart'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading } from '@/components/typography'
import { usePairs } from '@/context/pairsContext'
import { useTokens } from '@/context/tokensContext'
import { useGlobalChartData } from '@/hooks/useGraph'
import { fetchStats } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import PairsTable from './pairs/PairsTable'
import TokensTable from './tokens/TokensTable'

export default function AnalyticsPage() {
  const { networkId } = useChainSettings()
  const { data: stats } = useSWR(
    'stats api',
    { fetcher: fetchStats },
    {
      refreshInterval: 60000,
    },
  )
  const chartData = useGlobalChartData()
  const { pairs } = usePairs()
  const { push } = useRouter()
  const { tokens } = useTokens()
  const t = useTranslations()

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
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <HoverableChart
              chartData={chartData}
              protocolData={totalStats}
              valueProperty='tvlUSD'
              title='TVL'
              ChartComponent={LineChart}
            />
            <HoverableChart
              chartData={chartData ? chartData.slice(0, chartData.length - 1) : undefined}
              protocolData={totalStats}
              valueProperty='volumeUSD'
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
