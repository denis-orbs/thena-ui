import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { batch, useSelector } from 'react-redux'

import { Warning } from '@/components/alert'
import { OutlineIconButton } from '@/components/buttons/IconButton'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { TextHeading } from '@/components/typography'
import { useWindowSize } from '@/hooks/useWindowSize'
import { cn } from '@/lib/utils'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import { Bound } from '@/state/fusion/actions'
import { useActivePreset } from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import { ZoomInIcon, ZoomOutIcon } from '@/svgs'

import ActivePriceRangeChart from './ActivePriceRangeChart'
import ChartPrice from './ChartPrice'

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

export default function ChartPriceRangeInput({
  currencyA,
  currencyB,
  ticksAtLimit,
  price,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive,
  handleShow = true,
  showPeriod = false,
  enableScroll = false,
  outOfRange = false,
  invalidRange = false,
  fullRangeWarningShown = false,
  classNames,
  isCreate = false,
}) {
  const activePreset = useActivePreset()
  const isFullRange = activePreset === Presets.FULL
  const t = useTranslations()
  const zoomRef = useRef(null)

  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped)
  const [boundaryPrices, setBoundaryPrices] = useState()

  const [timeWindow, setTimeWindow] = useState(PairDataTimeWindow.YEAR)
  const { isReverse } = useSelector(state => state.fusion)

  const [firstCurrency, secondCurrency] = useMemo(
    () => (isReverse ? [currencyB, currencyA] : [currencyA, currencyB]),
    [isReverse, currencyB, currencyA],
  )

  const [baseCurrency, setBaseCurrency] = useState(firstCurrency)
  const [quoteCurrency, setQuoteCurrency] = useState(secondCurrency)

  const [chartPriceFinishedRender, setChartPriceFinishedRender] = useState(false)

  useEffect(() => {
    setBaseCurrency(firstCurrency)
    setQuoteCurrency(secondCurrency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReverse])

  const {
    data: pairPrices = [],
    isLoading,
    error,
  } = useFetchPairPrices({
    token0Address: isReverse ? baseCurrency.wrapped.address : quoteCurrency.wrapped.address,
    token1Address: isReverse ? quoteCurrency.wrapped.address : baseCurrency.wrapped.address,
    timeWindow,
    currentSwapPrice: { [isReverse ? baseCurrency.wrapped.address : quoteCurrency.wrapped.address]: price },
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

  useEffect(() => {
    if (pairPrices.length > 0) {
      setMidPrice(
        !isCreate ? pairPrices[pairPrices.length - 1]?.value : price ?? pairPrices[pairPrices.length - 1]?.value,
      )
    }
  }, [isCreate, pairPrices, price])

  const scrollIncrement = (dataMax - dataMin) / 10

  const [range, setRange] = useState(2)
  // Sets the min/max prices of the price axis manually, which is used to center the current price and zoom in/out.
  const { minVisiblePrice, maxVisiblePrice } = useMemo(() => {
    if (!midPrice) {
      return {
        minVisiblePrice: dataMin,
        maxVisiblePrice: dataMax,
      }
    }
    const mostRecentPrice = !isCreate
      ? pairPrices[pairPrices.length - 1]?.value
      : price ?? pairPrices[pairPrices.length - 1]?.value
    // Calculate the default range based on the current price.
    const maxSpread = Math.max(mostRecentPrice - dataMin, dataMax - mostRecentPrice)
    // Initial unscaled range to fit all values with the current price centered
    const initialRange = range * maxSpread
    const newRange = initialRange / zoomFactor

    return {
      minVisiblePrice: midPrice - newRange / 2,
      maxVisiblePrice: midPrice + newRange / 2,
    }
  }, [dataMax, dataMin, isCreate, midPrice, pairPrices, price, range, zoomFactor])

  const [isOutOfView, setIsOutOfView] = useState(false)

  useEffect(() => {
    if (isOutOfView && zoomFactor === 1 && !isFullRange) {
      const interval = setInterval(() => {
        setRange(prev => {
          const newRange = prev * 1.2
          return newRange
        })
      }, 50)

      return () => clearInterval(interval)
    }
    if (isFullRange) {
      setRange(2)
    }
  }, [isOutOfView, zoomFactor, isFullRange])

  const periods = useMemo(
    () => [
      {
        label: '24H',
        active: timeWindow === PairDataTimeWindow.DAY,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.DAY)
          setZoomFactor(1)
          setBoundaryPrices(undefined)
          setRange(2)
        },
      },
      {
        label: '1W',
        active: timeWindow === PairDataTimeWindow.WEEK,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.WEEK)
          setZoomFactor(1)
          setBoundaryPrices(undefined)
          setRange(2)
        },
      },
      {
        label: '1M',
        active: timeWindow === PairDataTimeWindow.MONTH,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.MONTH)
          setZoomFactor(1)
          setBoundaryPrices(undefined)
          setRange(2)
        },
      },
      {
        label: '1Y',
        active: timeWindow === PairDataTimeWindow.YEAR,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.YEAR)
          setZoomFactor(1)
          setBoundaryPrices(undefined)
          setRange(2)
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
  interactive = interactive && Boolean(pairPrices?.length)

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

  const [chartSize, setChartSize] = useState()

  const windowSize = useWindowSize()

  useEffect(() => {
    if (containerRef?.current) {
      setChartSize({
        chartContainerWidth: containerRef?.current?.offsetWidth,
        chartContainerHeight: containerRef?.current?.offsetHeight,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef?.current, windowSize, setZoomFactor])

  useEffect(() => {
    setZoomFactor(prevZoomFactor => (prevZoomFactor < 1 ? 1 : prevZoomFactor / 1.2))
  }, [windowSize.width])
  useEffect(() => {
    if (chartPriceFinishedRender) {
      setBoundaryPrices([minVisiblePrice, maxVisiblePrice])
    }
  }, [chartPriceFinishedRender, maxVisiblePrice, minVisiblePrice])

  useEffect(() => {
    if (!enableScroll) return
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
  }, [enableScroll, midPrice, minVisiblePrice, scrollIncrement])

  const isUninitialized = !currencyA || !currencyB

  return (
    <div className='flex flex-col'>
      {showPeriod && <Tabs data={periods} className={cn('max-md:hidden', classNames?.periods)} />}

      <div className='flex flex-col gap-2 md:gap-4'>
        {isFullRange && fullRangeWarningShown && <Warning className='text-sm'>{t('Full range position')}</Warning>}
        {outOfRange && <Warning className='text-sm'>{t('Out range warning')}</Warning>}
        {invalidRange && <Warning className='text-sm'>{t('Invalid range warning')}</Warning>}
        <div className='relative flex h-[300px] w-full items-center justify-center'>
          {isUninitialized ? (
            <TextHeading>Your position will appear here.</TextHeading>
          ) : isLoading ? (
            <Skeleton className='absolute h-[300px] w-full' />
          ) : error ? (
            <TextHeading>Liquidity data not available.</TextHeading>
          ) : (
            <div className='flex h-full max-h-[300px] w-full flex-col' ref={containerRef}>
              <div className='flex justify-end justify-items-end max-md:mb-4 max-md:justify-between'>
                {showPeriod && <Tabs data={periods} className={cn('md:hidden')} />}
                <div className='flex gap-1'>
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
              </div>
              <div className='flex h-full w-full flex-col gap-8'>
                <div ref={zoomRef} className='h-full w-full'>
                  <div
                    className='relative h-full w-full'
                    style={{
                      width: chartSize?.chartContainerWidth,
                      height: chartSize?.chartContainerHeight || 300,
                    }}
                  >
                    <div
                      className='absolute inset-0 z-0 mx-auto h-full'
                      style={{
                        width:
                          (chartSize?.chartContainerWidth || 0) -
                          desktopSizes.rightAxisWidth -
                          (chartSize?.chartContainerWidth <= 450 ? 5 : (chartSize?.chartContainerWidth || 0) * 0.2),
                      }}
                    >
                      {pairPrices.length > 0 && !isLoading && (
                        <ChartPrice
                          data={pairPrices}
                          timeWindow={timeWindow}
                          setBoundaryPrices={setBoundaryPrices}
                          minVisiblePrice={minVisiblePrice}
                          maxVisiblePrice={maxVisiblePrice}
                          isMobile={chartSize?.chartContainerWidth <= 450}
                          setFinishedRender={setChartPriceFinishedRender}
                        />
                      )}
                    </div>
                    <div className='absolute inset-0 z-10'>
                      {!brushDomain ? (
                        <TextHeading className='mx-auto block text-center text-sm lg:text-base'>
                          {t('Your Range will appear here')}
                        </TextHeading>
                      ) : (
                        <></>
                      )}
                      {chartSize && sortedFormattedData.length > 0 ? (
                        <ActivePriceRangeChart
                          data={{
                            series: sortedFormattedData,
                            current: !isCreate
                              ? pairPrices[pairPrices.length - 1]?.value
                              : price ?? pairPrices[pairPrices.length - 1]?.value,
                            min: boundaryPrices?.[0],
                            max: boundaryPrices?.[1],
                          }}
                          dimensions={{
                            width: chartSize?.chartContainerWidth,
                            height:
                              (chartSize?.chartContainerHeight || 300) -
                                ((chartSize?.chartContainerHeight || 300) * 0.2 + 28) ?? 300 - (300 * 0.2 + 28), // margin and time scale
                            contentWidth: chartSize?.chartContainerWidth,
                            axisLabelPaneWidth: desktopSizes.rightAxisWidth,
                          }}
                          styles={{
                            area: {
                              selection: '#BD60BA80',
                            },
                            brush: {
                              handle: {
                                south: '#F199EE',
                                north: '#F199EE',
                              },
                            },
                          }}
                          interactive
                          brushLabels={brushLabelValue}
                          brushDomain={brushDomain}
                          onBrushDomainChange={onBrushDomainChangeEnded}
                          handleShow={handleShow && brushDomain && chartPriceFinishedRender}
                          setIsOutOfView={setIsOutOfView}
                          isFullRange={isFullRange}
                        />
                      ) : (
                        <Skeleton className='h-full w-full' />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
