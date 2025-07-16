import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import useSWR from 'swr'

import { fetchPairChartData } from '@/app/analytics/pairs/[address]/PairChart'
import Loading from '@/app/loading'
import BarChart from '@/components/charts/BarChart'
import HoverableChart from '@/components/charts/HoverableChart'
import LineChart from '@/components/charts/LineChart'
import Divider from '@/components/divider'
import Selection from '@/components/selection'
import { NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { usePairs } from '@/context/pairsContext'
import { cn } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import LiquidityCharts from './LiquidityCharts'

const ChartType = {
  TVL: 'TVL',
  Volume: 'Volume',
  Fees: 'Fees',
  // Liquidity: 'Liquidity',
}

export function PoolChart({ address, showTitle = true, isSimple = false }) {
  const { pairs, isLoading } = usePairs()
  const { networkId } = useChainSettings()
  const t = useTranslations()
  const [chartType, setChartType] = useState(ChartType.TVL)
  const assets = useAssets()
  const [firstAsset, setFirstAsset] = useState()
  const [secondAsset, setSecondAsset] = useState()
  const [strategy, setStrategy] = useState(null)

  const { isReverse } = useSelector(state => state.fusion)

  const pair = useMemo(
    () => (pairs ? pairs.find(ele => ele.address.includes(address?.toLowerCase())) : undefined),
    [pairs, address],
  )

  const { data: chartData } = useSWR(pair && ['pool/chart', pair.address], () => fetchPairChartData(networkId, pair), {
    refreshInterval: 0,
  })

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
          <HoverableChart
            chartData={chartData}
            protocolData={pair}
            valueProperty='tvlUSD'
            title='TVL'
            ChartComponent={LineChart}
            className='p-0! max-lg:bg-transparent'
            isSimple={isSimple}
          />
        )
      }
      case ChartType.Volume: {
        return (
          <HoverableChart
            chartData={chartData ? chartData.slice(0, chartData.length - 1) : undefined}
            protocolData={pair}
            valueProperty='dayVolume'
            title='Volume (24h)'
            ChartComponent={BarChart}
            className='p-0! max-lg:bg-transparent'
            isSimple={isSimple}
          />
        )
      }
      case ChartType.Fees: {
        return (
          <HoverableChart
            chartData={chartData ? chartData.slice(0, chartData.length - 1) : undefined}
            protocolData={pair}
            valueProperty='dayFees'
            title='Fees (24h)'
            ChartComponent={BarChart}
            className='p-0! max-lg:bg-transparent'
            isSimple={isSimple}
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
  }, [chartType, chartData, pair, isSimple, firstAsset, secondAsset, strategy, isReverse])

  if (isLoading || !pair) {
    return <Loading />
  }

  return (
    <div className='flex w-full flex-col lg:gap-4'>
      {!isSimple && (
        <div className='w-full items-center justify-between lg:flex'>
          {showTitle && <NewTextSubHeading className='max-lg:hidden'>{t('Analytics')}</NewTextSubHeading>}
          <Selection
            isFull
            data={chartTypeSelection}
            className='mt-0 w-full max-lg:h-8 max-lg:rounded-none max-lg:bg-transparent max-lg:px-4 max-lg:py-1 lg:w-[565px]'
            isTranslation={false}
          />
        </div>
      )}
      <Divider className={cn('mx-4 my-3 h-0.5 lg:hidden', isSimple && 'hidden')} />
      <div className={cn('p-0 lg:rounded-lg', !isSimple && 'px-4 lg:bg-neutral-900 lg:py-6', isSimple && 'scale-105')}>
        {renderChart}
      </div>
    </div>
  )
}
