import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useLocaleSettings } from '@/state/settings/hooks'
import { formatAmount } from '@/utils/utils'

import Skeleton from '../skeleton'

function MultipleLineChart({ data, setHoverValue, setHoverDate, numberFormat }) {
  const chartRef = useRef(null)
  const [chartCreated, setChart] = useState()
  const { locale } = useLocaleSettings()

  const transformedData = useMemo(() => {
    if (data) {
      return data.map(chart =>
        chart.map(({ time, value }) => ({
          time: time.getTime(),
          value,
        })),
      )
    }
    return []
  }, [data])

  useEffect(() => {
    if (!chartRef?.current || !transformedData || transformedData.length === 0) return

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
        tickMarkFormatter: unixTime => dayjs(unixTime).format('MMM D'),
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
        priceFormatter: priceValue => `${numberFormat ? '' : '$'}${formatAmount(priceValue, true, 3, !numberFormat)}`,
      },
    })

    const series = []
    const colors = ['#F199EE', '#A5D6A7', '#FFCC99'] // Example color palette

    for (let i = 0; i < 3; i++) {
      // Adjust loop count based on desired number of series
      const newSeries = chart.addLineSeries({
        lineWidth: 2,
        color: colors[i],
        priceFormat: {
          type: numberFormat ? 'volume' : 'price',
          precision: 4,
          minMove: numberFormat ? 1 : 0.0001,
        },
        autoscaleInfoProvider: original => {
          const res = original()
          const allZero = transformedData.every(val => val.value === 0)
          // When all data are zero then set default range to 0 - 10
          if (allZero) {
            res.priceRange.minValue = 0
            res.priceRange.maxValue = 10
          }
          return res
        },
      })
      series.push(newSeries)
    }
    setChart(chart)
    series.forEach((seriesItem, index) => {
      if (data[index]) {
        // Check if data exists for the current series
        seriesItem.setData(transformedData[index]) // Assuming data is structured differently for each series
      }
    })

    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove(param => {
      if (param) {
        const timestamp = param.time
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
        const parsedValues = series.map(seriesItem => param.seriesData.get(seriesItem)?.value ?? 0)

        if (setHoverValue) setHoverValue(parsedValues)
        if (setHoverDate) setHoverDate(time)
      } else {
        if (setHoverValue) setHoverValue(undefined)
        if (setHoverDate) setHoverDate(undefined)
      }
    })

    return () => {
      chart.remove()
    }
  }, [transformedData, setHoverValue, setHoverDate, locale, numberFormat, data])

  const handleMouseLeave = useCallback(() => {
    if (setHoverValue) setHoverValue(undefined)
    if (setHoverDate) setHoverDate(undefined)
  }, [setHoverValue, setHoverDate])

  return (
    <>
      {!chartCreated && <Skeleton />}
      <div className='flex h-full flex-1' onMouseLeave={handleMouseLeave}>
        <div className='max-w-full flex-1' ref={chartRef} />
      </div>
    </>
  )
}

export default MultipleLineChart
