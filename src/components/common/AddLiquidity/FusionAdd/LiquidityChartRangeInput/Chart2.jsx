import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { darken } from 'polished'
import { useEffect, useMemo, useRef } from 'react'

import Skeleton from '@/components/skeleton'
import { formatAmount } from '@/lib/utils'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'

function Chart2({ data, timeWindow, setBoundaryPrices, minVisiblePrice, maxVisiblePrice }) {
  const chartRef = useRef(null)
  const chartCreated = useRef(null)

  const transformedData = useMemo(() => {
    if (data) {
      const baseData = data.map(({ time, value }) => ({
        time: time.getTime(),
        value,
      }))

      if (baseData.length > 0 && setBoundaryPrices) {
        setBoundaryPrices([minVisiblePrice, maxVisiblePrice])
      }

      return baseData
    }
    return []
  }, [data, maxVisiblePrice, minVisiblePrice, setBoundaryPrices])

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
        visible: false,
        borderVisible: false,
        mode: 0,
        autoScale: false,
        priceFormatter: price => `$${price.toFixed(2)} USD`,
      },
      timeScale: {
        visible: true,
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
      topColor: darken(0.01, 'transparent'),
      bottomColor: 'transparent',
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
      const minValueFromData = Math.min(...values)
      const maxValueFromData = Math.max(...values)

      const minValue = minVisiblePrice !== undefined ? minVisiblePrice : minValueFromData
      const maxValue = maxVisiblePrice !== undefined ? maxVisiblePrice : maxValueFromData

      chart.priceScale('right').applyOptions({
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        autoScale: false,
      })

      newSeries.applyOptions({
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue,
            maxValue,
          },
        }),
      })

      chart.timeScale().fitContent()
    }

    return () => {
      chart.remove()
    }
  }, [timeWindow, transformedData, minVisiblePrice, maxVisiblePrice])

  return (
    <div className='flex h-full w-full flex-1'>
      {(!chartCreated.current || !transformedData.length) && <Skeleton />}
      <div className='w-full flex-1' ref={chartRef} />
    </div>
  )
}

export default Chart2
