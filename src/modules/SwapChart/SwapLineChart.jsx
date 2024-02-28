import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { darken } from 'polished'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Skeleton from '@/components/skeleton'
import { formatAmount } from '@/lib/utils'

import { PairDataTimeWindow } from './fetch'

function SwapLineChart({ data, setHoverValue, setHoverDate, timeWindow }) {
  const chartRef = useRef(null)
  const [chartCreated, setChart] = useState()

  const transformedData = useMemo(() => {
    if (data) {
      return data.map(({ time, value }) => ({
        time: time.getTime(),
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
          timeWindow === PairDataTimeWindow.DAY ? dayjs(unixTime).format('HH:mm') : dayjs(unixTime).format('MMM D'),
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
        const timestamp = param.time
        if (!timestamp) return
        const time = dayjs(timestamp).format('MMM D, YYYY HH:mm (UTC)')
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
  }, [transformedData, setHoverValue, setHoverDate, timeWindow])

  const handleMouseLeave = useCallback(() => {
    if (setHoverValue) setHoverValue(undefined)
    if (setHoverDate) setHoverDate(undefined)
  }, [setHoverValue, setHoverDate])

  return (
    <>
      {(!chartCreated || !transformedData.length) && <Skeleton />}
      <div className='flex h-full flex-1' onMouseLeave={handleMouseLeave}>
        <div className='max-w-full flex-1' ref={chartRef} />
      </div>
    </>
  )
}

export default SwapLineChart
