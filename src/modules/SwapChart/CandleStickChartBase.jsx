import dayjs from 'dayjs'
import { createChart, PriceScaleMode } from 'lightweight-charts'
import { throttle } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { GreenBadge, PrimaryBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { formatPriceForChart } from '@/lib/utils'

import { ChartTimeInterval } from './fetch'
import { getClosePriceChange } from './utils'

export function CandleStickChartBase({
  data,
  setScrolling,
  setData,
  timeInterval,
  setTimeInterval,
  setLoadMoreData,
  activeToken,
}) {
  const [candleSeries, setCandleSeries] = useState()
  const [histogramSeries, setHistogramSeries] = useState()
  const chartContainerRef = useRef()
  const [hoverClose, setHoverClose] = useState()
  const [hoverDate, setHoverDate] = useState()
  const [isReady, setReady] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleScroll = useCallback(
    throttle(() => {
      setScrolling(true)
    }, 2000),
    [],
  )

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      layout: { textColor: 'white', background: { type: 'solid', color: 'rgba(0,0,0,0)' } },
      localization: {
        timeFormatter: time => dayjs.unix(time).utc().format('MMM DD, YYYY, HH:mm UTC'),
      },
      grid: {
        horzLines: {
          color: 'rgba(255,255,255,0.05)',
        },
        vertLines: {
          color: 'rgba(255,255,255,0.05)',
        },
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.3,
          bottom: 0.25,
        },
        borderVisible: false,
      },
    })

    const candlestickChartSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceFormat: {
        type: 'custom',
        formatter: priceValue => `$${formatPriceForChart(priceValue)}`,
      },
    })

    const histogramChartSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    })

    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    if (!candleSeries) {
      setCandleSeries(candlestickChartSeries)
    }
    if (!histogramSeries) {
      setHistogramSeries(histogramChartSeries)
    }
    chart.timeScale().fitContent()
    chart.timeScale().applyOptions({
      fixRightEdge: true,
      fixLeftEdge: true,
    })
    chart.priceScale('right').applyOptions({
      autoScale: true,
      mode: PriceScaleMode.Logarithmic,
    })
    chart.subscribeCrosshairMove(param => {
      if (candlestickChartSeries && param) {
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
    chart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
      if (logicalRange.from < 50) {
        handleScroll()
      }
    })
    return () => {
      chart.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (candleSeries && data.length) {
      try {
        candleSeries.setData(data)
        setReady(true)
      } catch (e) {
        console.error(e)
      }
    }
  }, [data, candleSeries])

  const histogramSeriesData = useMemo(() => {
    if (data?.length) {
      return data.map(bar => ({
        time: bar.time,
        value: bar.volume,
        color: bar.open > bar.close ? '#ef5350' : '#26a69a',
      }))
    }
    return []
  }, [data])

  useEffect(() => {
    if (histogramSeries && histogramSeriesData?.length) {
      try {
        histogramSeries.setData(histogramSeriesData)
        setReady(true)
      } catch (e) {
        console.error(e)
      }
    }
  }, [histogramSeriesData, histogramSeries])

  const valueToDisplay = useMemo(() => hoverClose || data[data.length - 1]?.close, [data, hoverClose])

  const { changePercentage, isChangePositive } = useMemo(() => {
    if (hoverClose) {
      const lastItem = data[data.length - 1]
      if (lastItem) {
        const copyPairPrices = [...data]
        copyPairPrices[data.length - 1] = { ...lastItem, close: hoverClose }
        return getClosePriceChange(copyPairPrices)
      }
    }
    return getClosePriceChange(data)
  }, [data, hoverClose])

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
          setData([])
          setLoadMoreData([])
          setTimeInterval(ChartTimeInterval.MIN_30)
        },
      },
      {
        label: '1h',
        active: timeInterval === ChartTimeInterval.HOUR_1,
        onClickHandler: () => {
          if (timeInterval === ChartTimeInterval.HOUR_1) return
          setData([])
          setLoadMoreData([])
          setTimeInterval(ChartTimeInterval.HOUR_1)
        },
      },
      {
        label: '4h',
        active: timeInterval === ChartTimeInterval.HOUR_4,
        onClickHandler: () => {
          if (timeInterval === ChartTimeInterval.HOUR_4) return
          setData([])
          setLoadMoreData([])
          setTimeInterval(ChartTimeInterval.HOUR_4)
        },
      },
      {
        label: '12h',
        active: timeInterval === ChartTimeInterval.HOUR_12,
        onClickHandler: () => {
          if (timeInterval === ChartTimeInterval.HOUR_12) return
          setData([])
          setLoadMoreData([])
          setTimeInterval(ChartTimeInterval.HOUR_12)
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeInterval, setData, setLoadMoreData],
  )

  return (
    <Box>
      <div className='flex flex-col items-start gap-2 lg:flex-row lg:justify-between'>
        <div className='flex flex-col gap-1'>
          {activeToken ? (
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
          {data.error ? (
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

      <div className='relative mt-2 flex h-[500px] items-center justify-center'>
        {data.error && <Paragraph>Failed to load price chart for this pair</Paragraph>}
        {!isReady && <Skeleton className='absolute' />}
        <div className='flex h-full w-full flex-1'>
          <div className='w-full flex-1' ref={chartContainerRef} />
        </div>
      </div>
    </Box>
  )
}
