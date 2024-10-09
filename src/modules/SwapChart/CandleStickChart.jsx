'use client'

import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { GreenBadge, PrimaryBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { STABLE_TOKENS } from '@/constant'
import { formatPriceForChart, wrappedAddress } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import { ChartTimeInterval } from './fetch'
import { fetchAdvancedPairPrices } from './hooks'
import { getClosePriceChange, NUMBER_VISIBLE_CHART_DATA } from './utils'

function CandleStickChart({ asset0, asset1 }) {
  const { networkId } = useChainSettings()
  const [currentTimeStamp, setCurrentTimeStamp] = useState(dayjs())
  const [timeInterval, setTimeInterval] = useState(ChartTimeInterval.MIN_30)
  const chartRef = useRef(null)
  const [chartCreated, setChart] = useState()
  const [chartData, setChartData] = useState([])
  const [hoverClose, setHoverClose] = useState()
  const [hoverDate, setHoverDate] = useState()

  const valueToDisplay = useMemo(() => hoverClose || chartData[chartData.length - 1]?.close, [chartData, hoverClose])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeStamp(dayjs())
    }, 1000 * 60)

    return () => clearInterval(interval)
  }, [])

  const activeToken = useMemo(() => {
    let token = asset0
    const listStableTokenAddress = Object.values(STABLE_TOKENS[networkId]).map(address => address.toLowerCase())
    if (listStableTokenAddress.includes(asset0?.address)) {
      token = asset1
    }
    return token
  }, [networkId, asset0, asset1])

  const fetchChartData = useCallback(
    () => fetchAdvancedPairPrices(wrappedAddress(activeToken), networkId, currentTimeStamp, timeInterval),
    [activeToken, networkId, timeInterval, currentTimeStamp],
  )

  useEffect(() => {
    const fetcher = async () => {
      const data = await fetchChartData()
      setChartData(data)
    }
    fetcher()
  }, [timeInterval, currentTimeStamp, networkId, fetchChartData])

  const { changePercentage, isChangePositive } = useMemo(() => {
    if (hoverClose) {
      const lastItem = chartData[chartData.length - 1]
      if (lastItem) {
        const copyPairPrices = [...chartData]
        copyPairPrices[chartData.length - 1] = { ...lastItem, close: hoverClose }
        return getClosePriceChange(copyPairPrices)
      }
    }
    return getClosePriceChange(chartData)
  }, [chartData, hoverClose])

  const currentDate = useMemo(() => {
    if (!hoverDate) {
      return new Date().toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    return null
  }, [hoverDate])

  const periods = useMemo(
    () => [
      {
        label: '30m',
        active: timeInterval === ChartTimeInterval.MIN_30,
        onClickHandler: () => {
          if (timeInterval === ChartTimeInterval.MIN_30) return
          setChartData([])
          setTimeInterval(ChartTimeInterval.MIN_30)
        },
      },
      {
        label: '1h',
        active: timeInterval === ChartTimeInterval.HOUR_1,
        onClickHandler: () => {
          if (timeInterval === ChartTimeInterval.HOUR_1) return
          setChartData([])
          setTimeInterval(ChartTimeInterval.HOUR_1)
        },
      },
      {
        label: '4h',
        active: timeInterval === ChartTimeInterval.HOUR_4,
        onClickHandler: () => {
          if (timeInterval === ChartTimeInterval.HOUR_4) return
          setChartData([])
          setTimeInterval(ChartTimeInterval.HOUR_4)
        },
      },
      {
        label: '12h',
        active: timeInterval === ChartTimeInterval.HOUR_12,
        onClickHandler: () => {
          if (timeInterval === ChartTimeInterval.HOUR_12) return
          setChartData([])
          setTimeInterval(ChartTimeInterval.HOUR_12)
        },
      },
    ],
    [timeInterval],
  )

  useEffect(() => {
    if (!chartData?.length) return

    const chart = createChart(chartRef?.current, {
      layout: { textColor: 'white', background: { type: 'solid', color: 'rgba(0,0,0,0)' } },
      localization: {
        priceFormatter: priceValue => `$${formatPriceForChart(priceValue)}`,
        timeFormatter: time => dayjs.unix(time).utc().format('MMM DD, YYYY, HH:mm UTC'),
      },
      handleScale: false,
      grid: {
        horzLines: {
          color: 'rgba(255,255,255,0.05)',
        },
        vertLines: {
          color: 'rgba(255,255,255,0.05)',
        },
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    candlestickSeries.setData(chartData)
    chart.timeScale().setVisibleLogicalRange({
      from: chartData.length - NUMBER_VISIBLE_CHART_DATA - 1 ?? 0,
      to: chartData.length,
    })
    chart.subscribeCrosshairMove(param => {
      if (candlestickSeries && param) {
        const { time, seriesData } = param
        if (!time) return
        const timeString = dayjs.unix(time).utc().format('MMM DD, YYYY, HH:mm UTC')
        if (setHoverClose) setHoverClose(seriesData?.values()?.next().value?.close)
        if (setHoverDate) setHoverDate(timeString)
      } else {
        if (setHoverClose) setHoverClose(undefined)
        if (setHoverDate) setHoverDate(undefined)
      }
    })

    setChart(chart)

    return () => {
      chart.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, networkId])

  return (
    <Box>
      <div className='flex flex-col items-start gap-2 lg:flex-row lg:justify-between'>
        <div className='flex flex-col gap-1'>
          {asset0 && asset1 ? (
            <div className='flex items-center gap-2'>
              <CircleImage
                className='h-6 w-6 -space-x-1.5 outline outline-[2px] outline-[#1C2027]'
                src={activeToken?.logoURI}
                alt='THENA First Logo'
              />

              <TextHeading className='text-xl'>{activeToken.symbol} / USD</TextHeading>
            </div>
          ) : (
            <Skeleton className='h-[28px] w-[150px]' />
          )}
          {chartData.error ? (
            <TextHeading className='text-xl'>-</TextHeading>
          ) : valueToDisplay ? (
            <div className='flex items-center gap-2'>
              <TextHeading className='text-xl'>${valueToDisplay && formatPriceForChart(valueToDisplay)}</TextHeading>
              {isChangePositive ? (
                <GreenBadge>{changePercentage}%</GreenBadge>
              ) : (
                <PrimaryBadge>{changePercentage}%</PrimaryBadge>
              )}
            </div>
          ) : (
            <Skeleton className='h-[28px] w-[150px]' />
          )}
          <Paragraph className='text-sm'>{hoverDate || currentDate}</Paragraph>
        </div>

        <Tabs data={periods} />
      </div>
      <div className='mt-2 flex h-[500px] items-center justify-center'>
        {chartData.error ? (
          <Paragraph>Failed to load price chart for this pair</Paragraph>
        ) : (
          <>
            {(!chartCreated || !chartData.length) && <Skeleton />}
            <div className='flex h-full w-full flex-1'>
              <div className='w-full flex-1' ref={chartRef} />
            </div>
          </>
        )}
      </div>
    </Box>
  )
}

export default memo(CandleStickChart)
