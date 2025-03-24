import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { darken } from 'polished'
import { useEffect, useMemo, useRef } from 'react'

import Skeleton from '@/components/skeleton'
import { formatAmount } from '@/lib/utils'

export class ChartModel {
  constructor(chartDiv, params) {
    this.chartDiv = chartDiv
    this.api = createChart(chartDiv, {
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
        autoScale: true,
        priceFormatter: price => `$${price.toFixed(2)} USD`,
      },
      timeScale: {
        visible: true,
        borderVisible: false,
        secondsVisible: false,
        tickMarkFormatter: unixTime =>
          params.timeWindow === 'DAY' ? dayjs(unixTime).format('HH:mm') : dayjs(unixTime).format('MMM D'),
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

    this.api.applyOptions({
      localization: {
        priceFormatter: priceValue => `${new BigNumber(priceValue).gte(1e13) ? '' : formatAmount(priceValue, true, 5)}`,
      },
    })

    const series = this.api.addAreaSeries({
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

    if (params.data) {
      series.setData(params.data)
    }

    if (params.lower) {
      series.createPriceLine({
        price: params.lower,
        color: '#84007F',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'lower',
      })
    }

    if (params.current) {
      series.createPriceLine({
        price: params.current,
        color: '#F8CCF6',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'current',
      })
    }

    if (params.upper) {
      series.createPriceLine({
        price: params.upper,
        color: '#E333DD',
        axisLabelTextColor: '#000000',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'upper',
      })
    }

    this.api.timeScale().fitContent()
  }

  fitContent() {
    this.api.timeScale().fitContent()
  }

  remove() {
    this.api.remove()
  }
}

export function Chart({ Model = ChartModel, params }) {
  const chartRef = useRef(null)
  const chartCreated = useRef(null)

  console.log(params)

  const transformedData = useMemo(() => {
    if (params.data) {
      return params.data.map(({ time, value }) => ({
        time: time.getTime(),
        value,
      }))
    }
    return []
  }, [params.data])

  useEffect(() => {
    if (!chartRef.current) return

    const chart = new Model(chartRef.current, {
      ...params,
      data: transformedData,
    })
    chartCreated.current = chart

    return () => {
      chart.remove()
    }
  }, [Model, params, transformedData])

  return (
    <div className='flex h-full w-full flex-1'>
      {(!chartCreated.current || !transformedData.length) && <Skeleton />}
      <div className='w-full flex-1' ref={chartRef} />
    </div>
  )
}
