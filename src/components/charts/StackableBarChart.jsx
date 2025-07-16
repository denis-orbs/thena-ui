// components/StackedBarChart.js
import dayjs from 'dayjs'
import { createChart, customSeriesDefaultOptions } from 'lightweight-charts'
import { sum } from 'lodash'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

import { StackedBarsSeries } from './stacked-bars-series'
import Skeleton from '../skeleton'

export const stackColors = ['#EA66E5', '#F199EE']
const epoch5 = 1675900800

function StackableBarChart({ data, setHoverValue, setHoverDate, valueProperty = [], useEpoch }) {
  const chartRef = useRef()
  const [chartCreated, setChartCreated] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    if (!chartRef.current || !data || !valueProperty.length) return
    const epochNumber = epochStartTimestamp => Math.floor((+epochStartTimestamp - epoch5) / 604800) + 5

    const chart = createChart(chartRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#747778' },
      autoSize: true,
      handleScale: false,
      handleScroll: false,
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        tickMarkFormatter: unixTime => (useEpoch ? epochNumber(unixTime / 1000) : dayjs(unixTime).format('MMM D')),
      },
      grid: {
        horzLines: { visible: false },
        vertLines: { visible: false },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          visible: true,
          labelVisible: false,
          style: 3,
          width: 1,
          color: '#747778',
        },
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
    })

    const stackedSeries = new StackedBarsSeries()
    const series = chart.addCustomSeries(stackedSeries, {
      ...customSeriesDefaultOptions,
      colors: valueProperty.map((_, i) => stackColors[i % stackColors.length]),
    })

    const transformedData = data.map(d => ({
      time: d.time.getTime(),
      values: valueProperty.map(key => d?.[key] || 0),
    }))

    series.setData(transformedData)

    chart.timeScale().fitContent()
    setChartCreated(true)

    chart.subscribeCrosshairMove(param => {
      if (!param.time) {
        setHoverValue?.(undefined)
        setHoverDate?.(undefined)
        return
      }
      const entry = transformedData.find(d => d.time === param.time)
      const value = entry ? sum(entry.values) : null
      if (useEpoch) {
        if (setHoverValue && value !== null) setHoverValue(value)
        if (setHoverDate) setHoverDate(`${t('Epoch')} ${epochNumber(param.time / 1000)}`)
      } else {
        const hoverTime = new Date(param.time)
        if (setHoverValue && value !== null) setHoverValue(value)
        if (setHoverDate) {
          setHoverDate(
            `${hoverTime.toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC',
            })} (UTC)`,
          )
        }
      }
    })

    return () => chart.remove()
  }, [data, setHoverDate, setHoverValue, useEpoch, valueProperty, t])

  const handleMouseLeave = useCallback(() => {
    setHoverValue?.(undefined)
    setHoverDate?.(undefined)
  }, [setHoverDate, setHoverValue])

  return (
    <>
      {!chartCreated && <Skeleton />}
      <div className='flex h-full flex-1' onMouseLeave={handleMouseLeave}>
        <div className='max-w-full flex-1' ref={chartRef} />
      </div>
    </>
  )
}

export default StackableBarChart
