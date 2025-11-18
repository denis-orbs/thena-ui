import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import useSWR from 'swr'

import { fetchPairChartData } from '@/app/analytics/pairs/[address]/PairChart'
import Loading from '@/app/loading'
import HoverAbleReChart from '@/components/charts/HoverAbleReChart'
import Divider from '@/components/divider'
import Selection from '@/components/selection'
import { NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { usePairs } from '@/context/pairsContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useChainSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'

import LiquidityCharts from './LiquidityCharts'

const ChartType = {
  TVL: 'TVL',
  Volume: 'Volume',
  Fees: 'Fees',
  // Liquidity: 'Liquidity',
}

export function PoolChart({ address, showTitle = true, isSimple = false, classNames }) {
  const { pairs, isLoading } = usePairs()
  const { networkId } = useChainSettings()
  const t = useTranslations()
  const [chartType, setChartType] = useState(ChartType.TVL)
  const assets = useAssets()
  const [firstAsset, setFirstAsset] = useState()
  const [secondAsset, setSecondAsset] = useState()
  const [strategy, setStrategy] = useState(null)
  const { isLgDown } = useMediaQuery()

  const { isReverse } = useSelector(state => state.fusion)

  const pair = useMemo(
    () => (pairs ? pairs.find(ele => ele.address.includes(address?.toLowerCase())) : undefined),
    [pairs, address],
  )

  const { data: chartData, isLoading: isLoadingChartData } = useSWR(
    pair && ['pool/chart', pair.address],
    () => fetchPairChartData(networkId, pair),
    {
      refreshInterval: 0,
    },
  )

  useEffect(() => {
    setFirstAsset(assets.find(ele => ele.address === pair?.token0?.address))
    setSecondAsset(assets.find(ele => ele.address === pair?.token1?.address))
  }, [assets, pair])

  const chartTypeSelection = useMemo(
    () =>
      Object.keys(ChartType)
        .filter(type => (pair?.type === PAIR_TYPES.LSD ? true : type !== ChartType.Liquidity))
        .map(name => ({
          label: name,
          active: chartType === name,
          onClickHandler: () => {
            setChartType(name)
          },
        })),
    [chartType, pair],
  )

  const renderChart = useMemo(() => {
    switch (chartType) {
      case ChartType.TVL: {
        return (
          <HoverAbleReChart
            chartData={chartData}
            valueProperty='tvlUSD'
            protocolData={pair}
            title='TVL'
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
              {
                dataKey: 'currentPrice',
                fill: '#F299EE',
                stroke: '#F299EE',
                strokeWidth: 2,
              },
            ]}
            type='area'
            className='flex flex-col max-lg:bg-transparent max-lg:p-0! lg:gap-6! lg:px-4! lg:pt-6!'
            isMinimum={isLgDown}
            isLoading={isLoadingChartData}
          />
        )
      }
      case ChartType.Volume: {
        return (
          <HoverAbleReChart
            chartData={chartData}
            valueProperty='dayVolume'
            protocolData={pair}
            title='Volume (24h)'
            chartConfig={{
              dayVolume: {
                label: t('Volume (24h)'),
              },
            }}
            chartItemConfigs={[
              {
                dataKey: 'dayVolume',
                fill: 'url(#fillGradient)',
                radius: [4, 4, 0, 0],
              },
            ]}
            type='bar'
            className='flex flex-col max-lg:bg-transparent max-lg:p-0! lg:gap-6! lg:px-4! lg:pt-6!'
            isMinimum={isLgDown}
            isLoading={isLoadingChartData}
          />
        )
      }
      case ChartType.Fees: {
        return (
          <HoverAbleReChart
            chartData={chartData}
            valueProperty='dayFees'
            protocolData={pair}
            title='Fees (24h)'
            chartConfig={{
              dayFees: {
                label: t('Fees (24h)'),
              },
            }}
            chartItemConfigs={[
              {
                dataKey: 'dayFees',
                fill: 'url(#fillGradient)',
                radius: [4, 4, 0, 0],
              },
            ]}
            type='bar'
            className='flex flex-col max-lg:bg-transparent max-lg:p-0! lg:gap-6! lg:px-4! lg:pt-6!'
            isMinimum={isLgDown}
            isLoading={isLoadingChartData}
          />
        )
      }
      case ChartType.Liquidity: {
        return (
          <LiquidityCharts
            pairType={pair.type}
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            strategy={strategy}
            setStrategy={setStrategy}
            isReverse={isReverse}
            isModal={false}
            isSimple={isSimple}
          />
        )
      }
      default: {
        return <></>
      }
    }
  }, [
    chartType,
    chartData,
    pair,
    t,
    isLgDown,
    firstAsset,
    secondAsset,
    strategy,
    isReverse,
    isSimple,
    isLoadingChartData,
  ])

  if (isLoading || !pair) {
    return <Loading />
  }

  return (
    <div className='flex w-full flex-col lg:gap-2'>
      <div className='w-full items-center justify-between lg:flex'>
        {showTitle && <NewTextSubHeading className='max-lg:hidden'>{t('Analytics')}</NewTextSubHeading>}
        <Selection
          isFull
          data={chartTypeSelection}
          className='mt-0 h-8 w-full rounded-none p-1 max-lg:bg-transparent max-lg:px-4 max-lg:py-1 lg:h-11 lg:w-[275px] lg:rounded-md xl:h-[38px] xl:w-[520px]'
          classNames={{ items: 'h-6 lg:h-9 xl:h-[30px] py-[4px]! text-xs! font-medium max-lg:px-4! max-lg:py-1!' }}
          isTranslation={false}
        />
      </div>
      <Divider className={cn('mx-4 my-3 h-0.5 lg:hidden', isSimple && 'hidden')} />
      <div className={cn('p-0 lg:rounded-lg', classNames?.chart)}>{renderChart}</div>
    </div>
  )
}
