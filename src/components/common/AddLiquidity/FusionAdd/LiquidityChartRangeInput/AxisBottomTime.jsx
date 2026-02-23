import dayjs from 'dayjs'
import { createChart } from 'lightweight-charts'
import { darken } from 'polished'
import { useEffect, useMemo, useRef } from 'react'

// import Skeleton from '@/components/skeleton'
import { PairDataTimeWindow } from '@/modules/SwapChart/constants'

function ChartAxisTime({
  data,
  timeWindow,
  minVisiblePrice,
  maxVisiblePrice,
  isMobile = false,
  setFinishedRender = () => {},
}) {
  const chartRef = useRef(null)
  const chartCreated = useRef(null)

  const transformedData = useMemo(() => {
    if (data) {
      const baseData = data.map(({ time, value }) => ({
        time: Math.floor(time.getTime() / 1000),
        value,
      }))

      return baseData.sort((a, b) => a.time - b.time)
    }
    return []
  }, [data])

  useEffect(() => {
    if (!chartRef?.current) return

    const chart = createChart(chartRef?.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#685770',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
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
        timeVisible: true,
        rightOffset: 3,
        rightBarStaysOnScroll: true,
        // fixRightEdge: true,
        tickMarkFormatter: unixTime =>
          timeWindow === PairDataTimeWindow.DAY
            ? dayjs.unix(unixTime).format('HH:mm')
            : dayjs.unix(unixTime).format('MMM D'),
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
          visible: false,
          labelVisible: false,
          style: 3,
          width: 1,
          color: '#747778',
        },
      },
    })

    const newSeries = chart.addAreaSeries({
      lineWidth: 0,
      lineColor: 'transparent',
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
          top: 0,
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
      setFinishedRender(true)
      chart.remove()
    }
  }, [timeWindow, isMobile, transformedData, minVisiblePrice, maxVisiblePrice, setFinishedRender])

  return (
    <div className='flex h-full w-full flex-1'>
      {/* {(!chartCreated.current || !transformedData.length) && <Skeleton />} */}
      <div className='axis-bottom-time w-full flex-1' ref={chartRef} />
    </div>
  )
}

export default ChartAxisTime
