import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { darken } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'

import Skeleton from '@/components/skeleton'
import { formatAmount } from '@/lib/utils'

import { PairDataTimeWindow } from './fetch'

function PoolChart({ data, timeWindow, upper, lower }) {
  console.log(data)
  const chartRef = useRef(null)
  const [chartCreated, setChart] = useState()

  const transformedData = useMemo(() => {
    if (data) {
      const baseData = data.map(({ time, value }) => ({
        time: time.getTime(),
        value,
      }))
      return baseData
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
        mode: 1,
        autoScale: true, // Disable auto-scaling
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
      priceScaleId: 'right',
    })
    setChart(chart)
    newSeries.setData(transformedData)

    chart.timeScale().fitContent()

    // Add custom price lines for upper, current, and lower levels
    if (upper) {
      newSeries.createPriceLine({
        price: upper,
        color: 'green',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'upper',
      })
    }

    // if (current) {
    //   newSeries.createPriceLine({
    //     price: current,
    //     color: 'pink',
    //     lineWidth: 1,
    //     lineStyle: 1,
    //     axisLabelVisible: true,
    //     title: 'current',
    //   })
    // }

    if (lower) {
      newSeries.createPriceLine({
        price: lower,
        color: 'red',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'lower',
      })
    }

    return () => {
      chart.remove()
    }
  }, [timeWindow, upper, lower, transformedData])

  return (
    <div className='flex h-full w-full flex-1'>
      {(!chartCreated || !transformedData.length) && <Skeleton />}
      <div className='w-full flex-1' ref={chartRef} />
    </div>
  )
}

export default PoolChart
