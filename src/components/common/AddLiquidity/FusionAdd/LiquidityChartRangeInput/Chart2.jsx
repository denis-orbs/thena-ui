import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { darken } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'

import Skeleton from '@/components/skeleton'
import { formatAmount } from '@/lib/utils'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'

function Chart2({ data, timeWindow, current, upper, lower, setBoundaryPrices }) {
  const chartRef = useRef(null)
  const chartCreated = useRef(null)
  const [chartBoundaries, setChartBoundaries] = useState({ min: null, max: null })

  const transformedData = useMemo(() => {
    if (data) {
      const baseData = data.map(({ time, value }) => ({
        time: time.getTime(),
        value,
      }))

      if (baseData.length > 0 && setBoundaryPrices) {
        const values = baseData.map(item => item.value)
        const minPrice = Math.min(...values)
        const maxPrice = Math.max(...values)
        setChartBoundaries({ min: minPrice, max: maxPrice })
        setBoundaryPrices([minPrice, maxPrice])
      }

      return baseData
    }
    return []
  }, [data, setBoundaryPrices])

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
        priceFormatter: price => `$${price.toFixed(2)} USD`,
      },
      timeScale: {
        visible: false,
        borderVisible: false,
        secondsVisible: false,
        tickMarkFormatter: unixTime =>
          timeWindow === PairDataTimeWindow.DAY ? dayjs(unixTime).format('HH:mm') : dayjs(unixTime).format('MMM D'),
      },
      grid: {
        horzLines: { visible: false },
        vertLines: { visible: false },
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
        priceFormatter: priceValue => `${new BigNumber(priceValue).gte(1e13) ? '' : formatAmount(priceValue, true, 5)}`,
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
      priceLineVisible: false,
      lastValueVisible: false,
    })

    chartCreated.current = chart
    newSeries.setData(transformedData)

    if (transformedData.length > 0) {
      const values = transformedData.map(item => item.value)
      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)

      chart.priceScale('right').applyOptions({
        scaleMargins: {
          top: 0, // TODO: adjust top and bottom margin.
          bottom: 0,
        },
        autoScale: false,
        minValue,
        maxValue,
      })

      chart.timeScale().fitContent()
    }

    // Thêm các price lines
    if (lower) {
      newSeries.createPriceLine({
        price: chartBoundaries?.[0],
        color: '#84007F',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'lower',
      })
    }

    if (current) {
      newSeries.createPriceLine({
        price: current,
        color: '#F8CCF6',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'current',
      })
    }

    if (upper) {
      newSeries.createPriceLine({
        price: chartBoundaries?.[1],
        color: '#E333DD',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'upper',
      })
    }

    return () => {
      chart.remove()
    }
  }, [timeWindow, upper, lower, transformedData, chartBoundaries, current])

  return (
    <div className='flex h-full w-full flex-1'>
      {(!chartCreated.current || !transformedData.length) && <Skeleton />}
      <div className='w-full flex-1' ref={chartRef} />
    </div>
  )
}

export default Chart2
