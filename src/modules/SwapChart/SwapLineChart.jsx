import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { darken } from 'polished'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Skeleton from '@/components/skeleton'
import { formatAmount } from '@/utils/utils'

import { PairDataTimeWindow } from './constants'

function SwapLineChart({ data, locale, setHoverValue, setHoverDate, timeWindow }) {
  const chartRef = useRef(null)
  const [chartCreated, setChart] = useState()

  const transformedData = useMemo(() => {
    if (data) {
      return data.map(({ time, value }) => ({
        time: Math.floor(time.getTime() / 1000),
        value,
      }))
    }
    return []
  }, [data])

  useEffect(() => {
    if (!chartRef?.current) return

    const chart = createChart(chartRef?.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#747778',
      },
      autoSize: true,
      handleScale: false,
      handleScroll: false,
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        borderVisible: false,
      },
      timeScale: {
        visible: true,
        borderVisible: false,
        secondsVisible: false,
        tickMarkFormatter: unixTime =>
          timeWindow === PairDataTimeWindow.DAY
            ? dayjs.unix(unixTime).format('HH:mm')
            : dayjs.unix(unixTime).format('MMM D'),
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
        mode: 1,
        vertLine: {
          visible: true,
          labelVisible: false,
          style: 3,
          width: 1,
          color: '#747778',
        },
      },
    })

    chart.applyOptions({
      localization: {
        priceFormatter: priceValue => `${formatAmount(priceValue, false, 4)}`,
      },
    })

    const newSeries = chart.addAreaSeries({
      lineWidth: 2,
      lineColor: '#F199EE',
      topColor: darken(0.01, '#F199EE'),
      bottomColor: '#F199EE00',
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.0001,
      },
    })
    setChart(chart)
    newSeries.setData(transformedData)

    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove(param => {
      if (newSeries && param) {
        const timestamp = param.time * 1000
        if (!timestamp) return
        const now = new Date(timestamp)
        const time = `${now.toLocaleString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'UTC',
        })} (UTC)`
        const parsed = param.seriesData.get(newSeries)?.value ?? 0
        if (setHoverValue) setHoverValue(parsed)
        if (setHoverDate) setHoverDate(time)
      } else {
        if (setHoverValue) setHoverValue(undefined)
        if (setHoverDate) setHoverDate(undefined)
      }
    })

    return () => {
      chart.remove()
    }
  }, [transformedData, setHoverValue, setHoverDate, timeWindow, locale])

  const handleMouseLeave = useCallback(() => {
    if (setHoverValue) setHoverValue(undefined)
    if (setHoverDate) setHoverDate(undefined)
  }, [setHoverValue, setHoverDate])

  return (
    <>
      {(!chartCreated || !transformedData.length) && <Skeleton />}
      <div className='flex h-full w-full flex-1' onMouseLeave={handleMouseLeave}>
        <div className='max-w-full flex-1' ref={chartRef} />
      </div>
    </>
  )
}

export default SwapLineChart
