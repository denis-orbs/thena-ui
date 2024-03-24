import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { formatAmount } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'

import Skeleton from '../skeleton'

function BarChart({ data, setHoverValue, setHoverDate }) {
  const chartRef = useRef(null)
  const [chartCreated, setChart] = useState()
  const { locale } = useLocaleSettings()

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
          top: 0.01,
          bottom: 0,
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
        priceFormatter: priceValue => `$${formatAmount(priceValue, true)}`,
      },
    })

    const newSeries = chart.addHistogramSeries({
      color: '#F199EE',
    })
    setChart(chart)
    newSeries.setData(transformedData)

    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove(param => {
      if (newSeries && param) {
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
  }, [transformedData, setHoverValue, setHoverDate, locale])

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

export default BarChart
