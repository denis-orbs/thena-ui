import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { batch, useSelector } from 'react-redux'

import { OutlineIconButton } from '@/components/buttons/IconButton'
import { useDensityChartData } from '@/components/common/AddLiquidity/FusionAdd/LiquidityChartRangeInput/hooks'
import Spinner from '@/components/spinner'
import Tabs from '@/components/tabs'
import { TextHeading } from '@/components/typography'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import { Bound } from '@/state/fusion/actions'
import { ZoomInIcon, ZoomOutIcon } from '@/svgs'

import ActiveLiquidityChart from './ActiveLiquidityChart'
import Chart2 from './Chart2'

const ZOOM_LEVEL = {
  initialMin: 0.9,
  initialMax: 1.1,
  min: 0.00001,
  max: 20,
}

const RIGHT_AXIS_WIDTH = 64
const CHART_CONTAINER_WIDTH = 452 + RIGHT_AXIS_WIDTH
const LIQUIDITY_CHART_WIDTH = 68
const INTER_CHART_PADDING = 12
const CHART_HEIGHT = 164
const BOTTOM_AXIS_HEIGHT = 28
const loadedPriceChartWidth = CHART_CONTAINER_WIDTH - LIQUIDITY_CHART_WIDTH - INTER_CHART_PADDING - RIGHT_AXIS_WIDTH

const desktopSizes = {
  rightAxisWidth: RIGHT_AXIS_WIDTH,
  chartContainerWidth: CHART_CONTAINER_WIDTH,
  liquidityChartWidth: LIQUIDITY_CHART_WIDTH,
  interChartPadding: INTER_CHART_PADDING,
  chartHeight: CHART_HEIGHT,
  bottomAxisHeight: BOTTOM_AXIS_HEIGHT,
  loadedPriceChartWidth,
}

export const DEFAULT_LOCALE = 'en-US'
// Used to format floats representing percent change with fixed decimal places
function formatDelta(delta, locale = DEFAULT_LOCALE) {
  if (delta === null || delta === undefined || delta === Infinity || isNaN(delta)) {
    return '-'
  }

  return `${Number(Math.abs(delta).toFixed(2)).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  })}%`
}

export default function LiquidityChartRangeInput2({
  currencyA,
  currencyB,
  feeAmount,
  ticksAtLimit,
  price,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive,
  handleShow = true,
  showPeriod = false,
}) {
  const zoomRef = useRef(null)

  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped)
  const [boundaryPrices, setBoundaryPrices] = useState()
  const { isLoading, error, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })

  const [timeWindow, setTimeWindow] = useState(PairDataTimeWindow.YEAR)
  const { isReverse } = useSelector(state => state.fusion)

  const [firstCurrency, secondCurrency] = useMemo(
    () => (isReverse ? [currencyB, currencyA] : [currencyA, currencyB]),
    [isReverse, currencyB, currencyA],
  )

  const [baseCurrency, setBaseCurrency] = useState(firstCurrency)
  const [quoteCurrency, setQuoteCurrency] = useState(secondCurrency)

  useEffect(() => {
    setBaseCurrency(firstCurrency)
    setQuoteCurrency(secondCurrency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReverse])

  const { data: pairPrices = [] } = useFetchPairPrices({
    token0Address: baseCurrency.wrapped.address,
    token1Address: quoteCurrency.wrapped.address,
    timeWindow,
  })

  const [zoomFactor, setZoomFactor] = useState(1)

  const brushDomain = useMemo(() => {
    const leftPrice = isSorted ? priceLower : priceUpper?.invert()
    const rightPrice = isSorted ? priceUpper : priceLower?.invert()

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : undefined
  }, [isSorted, priceLower, priceUpper])

  const { dataMin, dataMax } = useMemo(() => {
    const minValue = pairPrices.reduce((min, curr) => (curr.value < min.value ? curr : min), pairPrices[0])
    const maxValue = pairPrices.reduce((max, curr) => (curr.value > max.value ? curr : max), pairPrices[0])

    return { dataMin: minValue?.value, dataMax: maxValue?.value }
  }, [pairPrices])

  const [midPrice, setMidPrice] = useState()
  const [showDiffIndicators, setShowDiffIndicators] = useState(false)

  useEffect(() => {
    if (pairPrices.length > 0) {
      setMidPrice(pairPrices[pairPrices.length - 1]?.value)
    }
  }, [pairPrices])

  const scrollIncrement = (dataMax - dataMin) / 10

  // Sets the min/max prices of the price axis manually, which is used to center the current price and zoom in/out.
  const { minVisiblePrice, maxVisiblePrice } = useMemo(() => {
    if (!midPrice) {
      return {
        minVisiblePrice: dataMin,
        maxVisiblePrice: dataMax,
      }
    }
    const mostRecentPrice = pairPrices[pairPrices.length - 1]?.value
    // Calculate the default range based on the current price.
    const maxSpread = Math.max(mostRecentPrice - dataMin, dataMax - mostRecentPrice)
    // Initial unscaled range to fit all values with the current price centered
    const initialRange = 2 * maxSpread
    const newRange = initialRange / zoomFactor

    return {
      minVisiblePrice: midPrice - newRange / 2,
      maxVisiblePrice: midPrice + newRange / 2,
    }
  }, [dataMax, dataMin, midPrice, pairPrices, zoomFactor])

  const periods = useMemo(
    () => [
      {
        label: '24H',
        active: timeWindow === PairDataTimeWindow.DAY,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.DAY)
          setZoomFactor(1)
          setBoundaryPrices(undefined)
        },
      },
      {
        label: '1W',
        active: timeWindow === PairDataTimeWindow.WEEK,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.WEEK)
          setZoomFactor(1)
          setBoundaryPrices(undefined)
        },
      },
      {
        label: '1M',
        active: timeWindow === PairDataTimeWindow.MONTH,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.MONTH)
          setZoomFactor(1)
          setBoundaryPrices(undefined)
        },
      },
      {
        label: '1Y',
        active: timeWindow === PairDataTimeWindow.YEAR,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.YEAR)
          setZoomFactor(1)
          setBoundaryPrices(undefined)
        },
      },
    ],
    [timeWindow],
  )

  const containerRef = useRef(null)
  const sortedFormattedData = useMemo(
    () =>
      pairPrices
        ?.sort((a, b) => a.price0 - b.price0)
        .map(item => ({
          ...item,
          activeLiquidity: item.time.getTime(),
        })),
    [pairPrices],
  )

  const onBrushDomainChangeEnded = useCallback(
    (domain, mode) => {
      if (domain[0] < 0) {
        return
      }
      // While scrolling we receive updates to the range because the yScale changes,
      // but we can filter them out because they have an undefined "mode".
      // The initial range suggestion also comes with an undefined "mode", so we allow that here.
      const rejectAutoRangeSuggestion =
        boundaryPrices?.[0] !== undefined &&
        boundaryPrices?.[1] !== undefined &&
        boundaryPrices?.[0] >= 0 &&
        boundaryPrices?.[1] >= 0
      if (!mode && rejectAutoRangeSuggestion) {
        return
      }
      let leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6
      }

      if (handleShow) {
        batch(() => {
          // simulate user input for auto-formatting and other validations
          if (
            (!ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] || mode === 'handle' || mode === 'reset') &&
            leftRangeValue > 0
          ) {
            onLeftRangeInput(leftRangeValue.toFixed(6))
          }

          if ((!ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] || mode === 'reset') && rightRangeValue > 0) {
            // todo: remove this check. Upper bound for large numbers
            // sometimes fails to parse to tick.
            if (rightRangeValue < 1e35) {
              onRightRangeInput(rightRangeValue.toFixed(6))
            }
          }
        })
      }
    },
    [boundaryPrices, handleShow, ticksAtLimit, isSorted, onLeftRangeInput, onRightRangeInput],
  )

  // eslint-disable-next-line unused-imports/no-unused-vars
  interactive = interactive && Boolean(formattedData?.length)

  const brushLabelValue = useCallback(
    (d, x) => {
      if (!price) return ''

      if (d === 'w' && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]) return '0'
      if (d === 'e' && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]) return '∞'

      const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

      return price ? `${(Math.sign(percent) < 0 ? '-' : '') + formatDelta(percent)}` : ''
    },
    [isSorted, price, ticksAtLimit],
  )

  const [chartSize, setChartSize] = useState({})

  useEffect(() => {
    if (containerRef?.current) {
      setChartSize({
        chartContainerWidth: containerRef?.current?.offsetWidth,
        chartContainerHeight: containerRef?.current?.offsetHeight,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef?.current])

  useEffect(() => {
    const container = zoomRef.current
    if (container) {
      let lastCall = 0
      const throttleDelayMs = 50

      // WheelEvent
      const listener = event => {
        event.preventDefault()
        event.stopPropagation()

        const now = Date.now()
        if (now - lastCall >= throttleDelayMs) {
          lastCall = now

          if (event.deltaY < 0) {
            setMidPrice(prevMidPrice => (prevMidPrice ? prevMidPrice + scrollIncrement : undefined))
          } else if (event.deltaY > 0 && minVisiblePrice > 0) {
            setMidPrice(prevMidPrice => (prevMidPrice ? prevMidPrice - scrollIncrement : undefined))
          }
        }
      }

      container.addEventListener('wheel', listener)

      return () => {
        container.removeEventListener('wheel', listener)
      }
    }
    return undefined
  }, [midPrice, minVisiblePrice, scrollIncrement])

  const isUninitialized = !currencyA || !currencyB || (formattedData === undefined && !isLoading)

  return (
    <div className='flex flex-col gap-4'>
      {showPeriod && <Tabs data={periods} />}

      <div className='relative flex min-h-[300px] w-full items-center justify-center'>
        {isUninitialized ? (
          <TextHeading>Your position will appear here.</TextHeading>
        ) : isLoading ? (
          <Spinner />
        ) : error ? (
          <TextHeading>Liquidity data not available.</TextHeading>
        ) : !formattedData || formattedData.length === 0 || !price ? (
          <TextHeading>There is no liquidity data.</TextHeading>
        ) : (
          <>
            <div className='absolute -top-2 right-0 grid grid-cols-2 gap-1 md:-top-5'>
              <OutlineIconButton
                className='!size-6'
                classNames='!size-4'
                Icon={ZoomInIcon}
                onClick={() => {
                  setZoomFactor(prevZoomFactor => prevZoomFactor * 1.2)
                }}
                disabled={false}
              />
              <OutlineIconButton
                className='!size-6'
                classNames='!size-4'
                Icon={ZoomOutIcon}
                onClick={() => {
                  setZoomFactor(prevZoomFactor => prevZoomFactor / 1.2)
                }}
                disabled={false}
              />
            </div>
            <div
              className='flex h-full w-full flex-col gap-8 overflow-hidden'
              ref={containerRef}
              onMouseEnter={() => {
                setShowDiffIndicators(true)
              }}
              onMouseLeave={() => {
                setShowDiffIndicators(false)
              }}
            >
              <div ref={zoomRef} className='h-full w-full overflow-y-auto'>
                <div
                  className='relative h-full w-full overflow-y-auto'
                  style={{
                    width: chartSize?.chartContainerWidth,
                    height: chartSize?.chartContainerHeight || 300,
                  }}
                >
                  <div
                    className='absolute inset-0 z-0 mx-auto h-full'
                    style={{
                      width: (chartSize?.chartContainerWidth || 0) - desktopSizes.rightAxisWidth - 220,
                    }}
                  >
                    <Chart2
                      data={pairPrices}
                      timeWindow={timeWindow}
                      setBoundaryPrices={setBoundaryPrices}
                      minVisiblePrice={minVisiblePrice}
                      maxVisiblePrice={maxVisiblePrice}
                    />
                  </div>
                  <div className='absolute inset-0 z-10'>
                    <ActiveLiquidityChart
                      data={{
                        series: sortedFormattedData,
                        current: price,
                        min: boundaryPrices?.[0],
                        max: boundaryPrices?.[1],
                      }}
                      dimensions={{
                        width: chartSize?.chartContainerWidth,
                        height: (chartSize?.chartContainerHeight || 300) - 88,
                        contentWidth: chartSize?.chartContainerWidth,
                        axisLabelPaneWidth: desktopSizes.rightAxisWidth,
                      }}
                      showDiffIndicators={showDiffIndicators}
                      styles={{
                        area: {
                          selection: '#C672D8',
                        },
                        brush: {
                          handle: {
                            south: '#84007F',
                            north: '#E333DD',
                          },
                        },
                      }}
                      interactive
                      brushLabels={brushLabelValue}
                      brushDomain={brushDomain}
                      onBrushDomainChange={onBrushDomainChangeEnded}
                      zoomLevels={ZOOM_LEVEL}
                      ticksAtLimit={ticksAtLimit}
                      handleShow={handleShow}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
