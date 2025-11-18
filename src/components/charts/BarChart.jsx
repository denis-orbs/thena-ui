import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useLocaleSettings } from '@/state/settings/hooks'
import { formatAmount } from '@/utils/utils'

import Skeleton from '../skeleton'

const epoch5 = 1675900800

function BarChart({ data, setHoverValue, setHoverDate, isSimple = false, useEpoch }) {
  const chartRef = useRef(null)
  const [chartCreated, setChart] = useState()
  const { locale } = useLocaleSettings()
  const t = useTranslations()

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

    const epochNumber = epochStartTimestamp => Math.floor((+epochStartTimestamp - epoch5) / 604800) + 5

    const chart = createChart(chartRef?.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#747778',
      },
      autoSize: true,
      handleScale: false,
      handleScroll: false,
      rightPriceScale: {
        visible: !isSimple,
        scaleMargins: {
          top: 0.01,
          bottom: 0,
        },
        borderVisible: false,
      },
      timeScale: {
        visible: !isSimple,
        borderVisible: false,
        secondsVisible: false,
        tickMarkFormatter: unixTime => (useEpoch ? epochNumber(unixTime / 1000) : dayjs(unixTime).format('MMM D')),
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
          visible: !isSimple,
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
        if (useEpoch) {
          const parsed = param.seriesData.get(newSeries)?.value ?? 0
          if (setHoverValue) setHoverValue(parsed)
          if (setHoverDate) setHoverDate(`${t('Epoch')} ${epochNumber(timestamp / 1000)}`)
        } else {
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
        }
      } else {
        if (setHoverValue) setHoverValue(undefined)
        if (setHoverDate) setHoverDate(undefined)
      }
    })

    return () => {
      chart.remove()
    }
  }, [transformedData, setHoverValue, setHoverDate, locale, t, useEpoch, isSimple])

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
