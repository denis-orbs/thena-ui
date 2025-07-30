'use client'

import { groupBy } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import AnalyticsChart from '@/components/charts/AnalyticsChart'
import Collapsible from '@/components/collapse/Collapse2'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import Highlight from '@/components/highlight'
import { SearchInput2 } from '@/components/input/SearchInput'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading } from '@/components/typography'
import { NotShowBannerV3 } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useTokens } from '@/context/tokensContext'
import { useAnalyticsChartData } from '@/hooks/useGraph'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { fetchStats } from '@/lib/api'
import { fetchStats as fetchStatsRevenue } from '@/lib/subgraph'
import { cn, formatAmount } from '@/lib/utils'
import SummaryAnalyticsInfo from '@/modules/Analytics/SummaryAnalyticsInfo'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoCircleWhite } from '@/svgs'

import PairsTable from './pairs/PairsTable'
import TokensTable from './tokens/TokensTable'

export default function AnalyticsPage() {
  const { networkId } = useChainSettings()
  const [isExpanded, setIsExpanded] = useState('feeDistribution')
  const [searchTextTokens, setSearchTextTokens] = useState('')
  const [searchTextPairs, setSearchTextPairs] = useState('')
  const [tvlSubTitle, setTvlSubTitle] = useState(0)
  const [volumeSubTitle, setVolumeSubTitle] = useState(0)
  const [feesSubTitle, setFeesSubTitle] = useState(0)

  const { isLgDown } = useMediaQuery()

  const { data: dataRevenue } = useSWR('thena total stats', () => fetchStatsRevenue())
  const { pairs, isLoading: isLoadingPairs } = usePairs()
  // const { push } = useRouter()
  const { tokens, isLoading: isLoadingTokens } = useTokens()
  const t = useTranslations()
  const { data: stats } = useSWR(
    'stats api',
    { fetcher: fetchStats },
    {
      refreshInterval: 60000,
    },
  )
  const { chartData: rawData, isLoading: isLoadingChartData } = useAnalyticsChartData()
  const groupEpochData = useMemo(() => {
    const groupData = groupBy(rawData ?? [], 'epoch')
    const result = {}

    for (let i = 0; i < Object.keys(groupData).length; i++) {
      const items = groupData[Object.keys(groupData)[i]]
      result[Object.keys(groupData)[i]] = items.reduce(
        (prevVal, curr) => ({
          ...prevVal,
          customPoolFeesUSD: prevVal.customPoolFeesUSD + curr.customPoolFeesUSD,
          veTheUSD: prevVal.veTheUSD + curr.veTheUSD,
          theNftUSD: prevVal.theNftUSD + curr.theNftUSD,
          tvlUSD: prevVal.tvlUSD + curr.tvlUSD,
          volumeUSD: prevVal.volumeUSD + curr.volumeUSD,
          date: !prevVal.date ? curr.date : Math.min(curr.date, prevVal.date),
        }),
        {
          chainId: networkId,
          epoch: Number(Object.keys(groupData)[i]),
          customPoolFeesUSD: 0,
          veTheUSD: 0,
          theNftUSD: 0,
          tvlUSD: 0,
          volumeUSD: 0,
          date: 0,
          bribeUSD: items[0]?.bribeUSD ?? 0,
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

  const filteredTokens = useMemo(
    () => (tokens ? tokens.filter(token => token.symbol.toLowerCase().includes(searchTextTokens.toLowerCase())) : []),
    [tokens, searchTextTokens],
  )

  const filteredPairs = useMemo(() => {
    if (!searchTextPairs) return pairs
    const searchTerms = searchTextPairs
      .toLowerCase()
      .split(/[\s/,]+/)
      .map(term => term.trim())

    return pairs.filter(pool => {
      const poolSymbols = (pool.symbol || '').toLowerCase().split('/')

      if (searchTerms.length === 2 && poolSymbols.length === 2) {
        return (
          (poolSymbols[0].includes(searchTerms[0]) && poolSymbols[1].includes(searchTerms[1])) ||
          (poolSymbols[0].includes(searchTerms[1]) && poolSymbols[1].includes(searchTerms[0]))
        )
      }

      return pool.symbol.toLowerCase().includes(searchTextPairs.toLowerCase())
    })
  }, [pairs, searchTextPairs])

  const [showBannerMigrate, setShowBannerMigrate] = useState(false)

  useEffect(() => {
    const updateBanner = () => {
      const shouldShow = !localStorage.getItem(NotShowBannerV3) && new Date() >= new Date('2025-05-22')
      setShowBannerMigrate(shouldShow)
    }

    updateBanner()

    window.addEventListener('local-storage-changed', updateBanner)
    return () => window.removeEventListener('local-storage-changed', updateBanner)
  }, [])

  return (
    <LayoutWithBackButton
      hiddenBackButton
      className={cn(
        '3xl:w-[1464px] 3xl:mt-8! mt-6 max-md:mx-4! xl:mx-12 2xl:mx-auto 2xl:w-[1344px]',
        showBannerMigrate && 'lg:-mt-8!',
      )}
    >
      <div className='flex flex-col gap-4 lg:gap-8'>
        <SummaryAnalyticsInfo totalStats={totalStats} />
        <div className='flex flex-col gap-2 lg:gap-4'>
          <h2>{t('Analytics')}</h2>
          {isLgDown ? (
            <>
              {/* TVL chart */}
              <Collapsible
                title={<span className='font-archia text-xl leading-6 font-semibold'>{t('TVL')}</span>}
                subtitle={<span className='block h-4'>${formatAmount(tvlSubTitle)}</span>}
                previewContent={
                  <div className='h-[143px] w-full overflow-hidden bg-[url("/images/line-chart.png")] bg-[length:100%_143px] bg-center bg-no-repeat' />
                }
                className='px-0!'
                classNames={{ preview: 'px-0!', content: 'pb-4 pr-2 pl-0!', headerClosed: '-mt-11' }}
              >
                <AnalyticsChart
                  className='border-none! bg-transparent p-0!'
                  classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia leading-6!' }}
                  rawData={rawData}
                  title='TVL'
                  defaultValue={totalStats?.tvlUSD}
                  chartId='tvlUSD'
                  chartConfig={{
                    tvlUSD: {
                      label: t('Total Volume'),
                    },
                    currentPrice: {
                      label: t('Current Price'),
                    },
                  }}
                  chartItemConfigs={[
                    {
                      dataKey: 'tvlUSD',
                      fill: 'url(#fillGradient)',
                      stroke: '#F299EE',
                      strokeWidth: 2,
                    },
                  ]}
                  defaultProperty='tvlUSD'
                  chartType='area'
                  isMinimum
                  onHoverChange={value => setTvlSubTitle(value)}
                  isLoading={isLoadingChartData}
                />
              </Collapsible>

              {/* Volume chart */}
              <Collapsible
                title={<span className='font-archia text-xl leading-6 font-semibold'>{t('Volume')}</span>}
                subtitle={<span className='block h-4'>${formatAmount(volumeSubTitle)}</span>}
                previewContent={
                  <div className='h-[143px] w-full bg-[url("/images/barchart.png")] bg-[length:auto_100%] bg-repeat-x' />
                }
                className='min-h-[197px]! px-0!'
                classNames={{
                  preview: 'px-0!',
                  content: 'pt-0 pb-4 pr-2 pl-0!',
                  headerClosed: 'border-t border-t-neutral-700 -mt-[2px]! h-[63px] pt-0 px-4',
                }}
              >
                <AnalyticsChart
                  className='border-none! bg-transparent p-0!'
                  classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia leading-6' }}
                  rawData={rawData}
                  title='Volume'
                  defaultValue={totalStats?.volumeUSD}
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
                      radius: [4, 4, 0, 0],
                    },
                  ]}
                  onExpand={() => setIsExpanded('volume')}
                  isExpanded={false}
                  onHoverChange={value => setVolumeSubTitle(value)}
                  isMinimum
                  xAxisLine
                  isLoading={isLoadingChartData}
                />
              </Collapsible>

              {/* Fees chart */}
              <Collapsible
                title={<span className='font-archia text-xl leading-6 font-semibold'>{t('Fees')}</span>}
                defaultTitle={<span className='font-archia text-xl leading-6 font-semibold'>{t('Total Revenue')}</span>}
                subtitle={<span className='block h-4'>${formatAmount(feesSubTitle)}</span>}
                defaultSubtitle={`$${formatAmount(dataRevenue?.revenueData)}`}
                // eslint-disable-next-line @next/next/no-img-element
                previewContent={
                  <div className='h-[143px] w-full bg-[url("/images/barchart-stack.png")] bg-[length:auto_100%] bg-repeat-x' />
                }
                className='min-h-[197px]! px-0!'
                classNames={{
                  preview: 'px-0!',
                  content: 'pt-0 pb-4 pr-2 pl-0!',
                  headerClosed: 'border-t border-t-neutral-700 -mt-[2px]! h-[63px] pt-0 px-4',
                }}
              >
                <AnalyticsChart
                  className='border-none! bg-transparent p-0!'
                  epochData={groupEpochData}
                  defaultDateHover='Total Revenue'
                  rawData={rawData}
                  title='Fees'
                  chartId='Fee Distribution'
                  chartConfig={{
                    bribeUSD: {
                      label: t('Incentives'),
                      onlyShowByEpoch: true,
                    },
                    veTheUSD: {
                      label: t('veTHE'),
                    },
                    customPoolFeesUSD: {
                      label: t('LP'),
                    },
                    theNftUSD: {
                      label: t('theNFT'),
                    },
                  }}
                  chartItemConfigs={[
                    {
                      dataKey: 'bribeUSD',
                      fill: '#E333DD',
                      opacity: 0.85,
                      radius: [4, 4, 0, 0],
                      onlyShowByEpoch: true,
                    },
                    {
                      dataKey: 'customPoolFeesUSD',
                      fill: '#BD60BA',
                      radius: [4, 4, 0, 0],
                    },
                    {
                      dataKey: 'theNftUSD',
                      fill: '#EA66E5',
                      radius: [4, 4, 0, 0],
                    },
                    {
                      dataKey: 'veTheUSD',
                      fill: '#F199EE',
                      opacity: 0.85,
                      radius: [4, 4, 0, 0],
                    },
                  ]}
                  onHoverChange={value => setFeesSubTitle(value)}
                  defaultValue={dataRevenue?.revenueData}
                  isMinimum
                  isLoading={isLoadingChartData}
                />
              </Collapsible>
            </>
          ) : (
            <>
              <div className='grid grid-cols-1 gap-6'>
                {isExpanded === 'feeDistribution' && (
                  <AnalyticsChart
                    epochData={groupEpochData}
                    defaultDateHover='Total Revenue'
                    rawData={rawData}
                    title='Fees'
                    chartId='Fee Distribution'
                    chartConfig={{
                      bribeUSD: {
                        label: t('Incentives'),
                        onlyShowByEpoch: true,
                      },
                      veTheUSD: {
                        label: t('veTHE'),
                      },
                      customPoolFeesUSD: {
                        label: t('LP'),
                      },
                      theNftUSD: {
                        label: t('theNFT'),
                      },
                    }}
                    chartItemConfigs={[
                      {
                        dataKey: 'bribeUSD',
                        fill: '#E333DD',
                        opacity: 0.85,
                        radius: [4, 4, 0, 0],
                        onlyShowByEpoch: true,
                      },
                      {
                        dataKey: 'customPoolFeesUSD',
                        fill: '#BD60BA',
                        radius: [4, 4, 0, 0],
                      },
                      {
                        dataKey: 'theNftUSD',
                        fill: '#EA66E5',
                        radius: [4, 4, 0, 0],
                      },
                      {
                        dataKey: 'veTheUSD',
                        fill: '#F199EE',
                        opacity: 0.85,
                        radius: [4, 4, 0, 0],
                      },
                    ]}
                    isExpanded
                    defaultValue={dataRevenue?.revenueData}
                    isLoading={isLoadingChartData}
                  />
                )}
                {isExpanded === 'tvl' && (
                  <AnalyticsChart
                    className='bg-chart-gradient rounded-xl border border-[#422D4C]'
                    rawData={rawData}
                    title='Total Value Locked'
                    defaultValue={totalStats?.tvlUSD}
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
                        strokeWidth: 2,
                      },
                    ]}
                    chartType='area'
                    isExpanded
                    isLoading={isLoadingChartData}
                  />
                )}
                {isExpanded === 'volume' && (
                  <AnalyticsChart
                    className='bg-chart-gradient rounded-xl border border-[#422D4C]'
                    rawData={rawData}
                    title='Volume (24h)'
                    defaultValue={totalStats?.volumeUSD}
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
                        // stroke: '#F299EE',
                        // shape: SingleBarReChart,

                        radius: [4, 4, 0, 0],
                      },
                    ]}
                    isExpanded
                    xAxisLine
                    isLoading={isLoadingChartData}
                  />
                )}
              </div>
              <div className='lg:bg-chart-gradient grid grid-cols-1 gap-4 rounded-xl bg-none lg:grid-cols-2'>
                {isExpanded === 'tvl' ? (
                  <AnalyticsChart
                    epochData={groupEpochData}
                    rawData={rawData}
                    classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia leading-6' }}
                    title='Fees'
                    defaultDateHover='Total Revenue'
                    defaultValue={dataRevenue?.revenueData}
                    chartId='Fee Distribution'
                    chartConfig={{
                      bribeUSD: {
                        label: t('Incentives'),
                        onlyShowByEpoch: true,
                      },
                      veTheUSD: {
                        label: t('veTHE'),
                      },
                      customPoolFeesUSD: {
                        label: t('LP'),
                      },
                      theNftUSD: {
                        label: t('theNFT'),
                      },
                    }}
                    chartItemConfigs={[
                      {
                        dataKey: 'bribeUSD',
                        fill: '#E333DD',
                        opacity: 0.85,
                        radius: [4, 4, 0, 0],
                        onlyShowByEpoch: true,
                      },
                      {
                        dataKey: 'customPoolFeesUSD',
                        fill: '#BD60BA',
                        radius: [4, 4, 0, 0],
                      },
                      {
                        dataKey: 'theNftUSD',
                        fill: '#EA66E5',
                        radius: [4, 4, 0, 0],
                      },
                      {
                        dataKey: 'veTheUSD',
                        fill: '#F199EE',
                        opacity: 0.85,
                        radius: [4, 4, 0, 0],
                      },
                    ]}
                    isExpanded={false}
                    onExpand={() => setIsExpanded('feeDistribution')}
                    isLoading={isLoadingChartData}
                  />
                ) : (
                  <AnalyticsChart
                    className='bg-chart-gradient border border-[#422D4C] bg-transparent lg:bg-none'
                    classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia leading-6' }}
                    rawData={rawData}
                    title='TVL'
                    defaultValue={totalStats?.tvlUSD}
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
                        strokeWidth: 2,
                      },
                    ]}
                    chartType='area'
                    isExpanded={false}
                    onExpand={() => setIsExpanded('tvl')}
                    isLoading={isLoadingChartData}
                  />
                )}
                {isExpanded === 'volume' ? (
                  <AnalyticsChart
                    rawData={rawData}
                    classNames={{ title: 'lg:text-xl font-semibold text-neutral-500 font-archia leading-6' }}
                    title='Fees'
                    defaultDateHover='Total Revenue'
                    chartId='Fee Distribution'
                    chartConfig={{
                      bribeUSD: {
                        label: t('Incentives'),
                        onlyShowByEpoch: true,
                      },
                      veTheUSD: {
                        label: t('veTHE'),
                      },
                      customPoolFeesUSD: {
                        label: t('LP'),
                      },
                      theNftUSD: {
                        label: t('theNFT'),
                      },
                    }}
                    chartItemConfigs={[
                      {
                        dataKey: 'bribeUSD',
                        fill: '#E333DD',
                        opacity: 0.85,
                        radius: [4, 4, 0, 0],
                        onlyShowByEpoch: true,
                      },
                      {
                        dataKey: 'customPoolFeesUSD',
                        fill: '#BD60BA',
                        radius: [4, 4, 0, 0],
                      },
                      {
                        dataKey: 'theNftUSD',
                        fill: '#EA66E5',
                        radius: [4, 4, 0, 0],
                      },
                      {
                        dataKey: 'veTheUSD',
                        fill: '#F199EE',
                        opacity: 0.85,
                        radius: [4, 4, 0, 0],
                      },
                    ]}
                    epochData={groupEpochData}
                    isExpanded={false}
                    onExpand={() => setIsExpanded('feeDistribution')}
                    defaultValue={dataRevenue?.revenueData}
                    isLoading={isLoadingChartData}
                  />
                ) : (
                  <AnalyticsChart
                    className='bg-chart-gradient border border-[#422D4C] bg-transparent lg:bg-none'
                    classNames={{ title: 'lg:text-xl! font-semibold text-neutral-500 font-archia leading-6' }}
                    rawData={rawData}
                    title='Volume (24h)'
                    defaultValue={totalStats?.volumeUSD}
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
                        // shape: SingleBarReChart,
                        radius: [4, 4, 0, 0],
                      },
                    ]}
                    onExpand={() => setIsExpanded('volume')}
                    isExpanded={false}
                    xAxisLine
                    isLoading={isLoadingChartData}
                  />
                )}
              </div>
            </>
          )}
        </div>
        {isLgDown ? (
          <Collapsible
            title={t('Top Assets')}
            subtitle={`${t('Price')} / ${t('Volume (24h)')}`}
            classNames={{ content: 'px-4 flex flex-col gap-4 pt-3 pb-4' }}
          >
            <SearchInput2
              val={searchTextTokens}
              setVal={setSearchTextTokens}
              className='h-11 lg:min-w-[339px]'
              classNames={{ input: 'h-11 px-4 py-3' }}
            />
            {filteredTokens.length > 0 ? (
              <TokensTable backUrlNumber={3} data={filteredTokens} />
            ) : isLoadingTokens ? (
              <div className='flex h-[538px] content-center items-center justify-center rounded-xl bg-neutral-900'>
                <Skeleton className='h-full w-full' />
              </div>
            ) : (
              <div className='flex h-[538px] content-center items-center justify-center rounded-xl bg-neutral-900'>
                <div className='flex flex-col items-center gap-4'>
                  <Highlight>
                    <InfoCircleWhite className='h-4 w-4' />
                  </Highlight>
                  <Paragraph className='text-sm text-neutral-500'>{t('No tokens found')}</Paragraph>
                </div>
              </div>
            )}
          </Collapsible>
        ) : (
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <TextHeading className='text-2xl text-neutral-50'>{t('Top Assets')}</TextHeading>
              <SearchInput2
                val={searchTextTokens}
                setVal={setSearchTextTokens}
                className='h-11 lg:min-w-[339px]'
                classNames={{ input: 'h-11 px-4 py-3' }}
              />
            </div>
            {filteredTokens.length > 0 ? (
              <TokensTable backUrlNumber={3} data={filteredTokens} />
            ) : isLoadingTokens ? (
              <div className='flex h-[538px] content-center items-center justify-center rounded-xl bg-neutral-900'>
                <Skeleton className='h-full w-full' />
              </div>
            ) : (
              <div className='flex h-[538px] content-center items-center justify-center rounded-xl bg-neutral-900'>
                <div className='flex flex-col items-center gap-4'>
                  <Highlight>
                    <InfoCircleWhite className='h-4 w-4' />
                  </Highlight>
                  <Paragraph className='text-sm text-neutral-500'>{t('No tokens found')}</Paragraph>
                </div>
              </div>
            )}
          </div>
        )}
        {isLgDown ? (
          <Collapsible
            title={t('Top Pairs')}
            subtitle={`${t('Liquidity')} / ${t('Volume (24h)')} / ${t('Fees (24h)')}`}
            classNames={{ content: 'px-4 flex flex-col gap-4 pt-3 pb-4' }}
          >
            <SearchInput2
              val={searchTextPairs}
              setVal={setSearchTextPairs}
              className='h-11 lg:min-w-[339px]'
              classNames={{ input: 'h-11 px-4 py-3' }}
            />
            {filteredPairs.length > 0 ? (
              <PairsTable backUrlNumber={3} data={filteredPairs} />
            ) : isLoadingPairs ? (
              <div className='flex h-[538px] content-center items-center justify-center rounded-xl bg-neutral-900'>
                <Skeleton className='h-full w-full' />
              </div>
            ) : (
              <div className='flex h-[538px] content-center items-center justify-center rounded-xl bg-neutral-900'>
                <div className='flex flex-col items-center gap-4'>
                  <Highlight>
                    <InfoCircleWhite className='h-4 w-4' />
                  </Highlight>
                  <Paragraph className='text-sm text-neutral-500'>{t('No pairs found')}</Paragraph>
                </div>
              </div>
            )}
          </Collapsible>
        ) : (
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <TextHeading className='text-2xl text-neutral-50'>{t('Top Pairs')}</TextHeading>
              <SearchInput2
                val={searchTextPairs}
                setVal={setSearchTextPairs}
                className='h-11 lg:min-w-[339px]'
                classNames={{ input: 'h-11 px-4 py-3' }}
              />
            </div>
            {filteredPairs.length > 0 ? (
              <PairsTable backUrlNumber={3} data={filteredPairs} />
            ) : isLoadingPairs ? (
              <div className='flex h-[538px] content-center items-center justify-center rounded-xl bg-neutral-900'>
                <Skeleton className='h-full w-full' />
              </div>
            ) : (
              <div className='flex h-[538px] content-center items-center justify-center rounded-xl bg-neutral-900'>
                <div className='flex flex-col items-center gap-4'>
                  <Highlight>
                    <InfoCircleWhite className='h-4 w-4' />
                  </Highlight>
                  <Paragraph className='text-sm text-neutral-500'>{t('No pairs found')}</Paragraph>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutWithBackButton>
  )
}
