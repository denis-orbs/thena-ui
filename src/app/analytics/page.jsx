'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { ChainId } from 'thena-sdk-core'

import PercentBadge from '@/components/badges/PercentBadge'
import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import BarChart from '@/components/charts/BarChart'
import HoverableChart from '@/components/charts/HoverableChart'
import LineChart from '@/components/charts/LineChart'
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
  const { data: stats } = useSWRImmutable(
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
  const totalStats = useMemo(
    () =>
      !stats
        ? undefined
        : networkId === ChainId.BSC
          ? stats.find(ele => ele.type === 'bsc-total')
          : stats.find(ele => ele.type === 'op-total'),
    [networkId, stats],
  )
  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-4'>
        <h2>Analytics</h2>
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
            <Paragraph className='text-sm'>TVL</Paragraph>
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
            <Paragraph className='text-sm'>Volume (24h)</Paragraph>
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
            <Paragraph className='text-sm'>Fees (24h)</Paragraph>
          </Box>
        </div>
      </div>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <TextHeading>Top Assets</TextHeading>
          <EmphasisButton
            onClick={() => {
              push('/analytics/tokens')
            }}
          >
            View All
          </EmphasisButton>
        </div>
        <TokensTable data={tokens} hidePagination />
      </div>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <TextHeading>Top Pairs</TextHeading>
          <EmphasisButton
            onClick={() => {
              push('/analytics/pairs')
            }}
          >
            View All
          </EmphasisButton>
        </div>
        <PairsTable data={pairs} hidePagination />
      </div>
    </div>
  )
}
