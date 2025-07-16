import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { batch, useDispatch, useSelector } from 'react-redux'

import { Warning } from '@/components/alert'
import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { NewTextHeading, TextHeading } from '@/components/typography'
import { useWindowSize } from '@/hooks/useWindowSize'
import { cn, formatAmount } from '@/lib/utils'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import { useAprStore } from '@/state/APR/store'
import { Bound, updateSelectedPreset } from '@/state/fusion/actions'
import { useActivePreset, useV3MintState } from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import { RefreshIcon, ZoomInIcon, ZoomOutIcon } from '@/svgs'

import ActivePriceRangeChart from './ActivePriceRangeChart'
import ChartPrice from './ChartPrice'
import { useDensityChartData } from './hooks'

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
  setLastPrice = () => {},
  isCreate = false,
  height = 300,
  idChart = 'chart-price-range',
  label = 'Liquidity range',
  feeAmount,
  maskColor,
  classNames,
}) {
  const activePreset = useActivePreset()
  const t = useTranslations()
  const zoomRef = useRef(null)
  const windowSize = useWindowSize()
  const { startPriceTypedValue, presetRange } = useV3MintState()
  const dispatch = useDispatch()
  console.log({ presetRange })
  const { isReverse } = useSelector(state => state.fusion)

  const [zoomFactor, setZoomFactor] = useState(1)
  const [boundaryPrices, setBoundaryPrices] = useState()
  const [timeWindow, setTimeWindow] = useState(PairDataTimeWindow.WEEK)
  const [currentHover, setCurrentHover] = useState(null)
  const [chartPriceFinishedRender, setChartPriceFinishedRender] = useState(false)
  const [range, setRange] = useState(2)
  const [midPrice, setMidPrice] = useState(null)
  const [isOutOfView, setIsOutOfView] = useState(false)

  const { APRs } = useAprStore()

  const isFullRange = useMemo(() => activePreset === Presets.FULL, [activePreset])

  const isUninitialized = useMemo(() => !currencyA || !currencyB, [currencyA, currencyB])

  const isSorted = useMemo(
    () => currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped),
    [currencyA, currencyB],
  )

  const {
    data: pairPrices = [],
    isLoading,
    error,
  } = useFetchPairPrices({
    token0Address: currencyB?.wrapped?.address,
    token1Address: currencyA?.wrapped?.address,
    timeWindow,
    currentSwapPrice: { [currencyB?.wrapped?.address]: price },
  })

  const {
    isLoading: isLoadLiquidity,
    // error: isLoadLiquidityError,
    formattedData,
  } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })

  const brushDomain = useMemo(() => {
    const leftPrice = isSorted ? priceLower : priceUpper?.invert()
    const rightPrice = isSorted ? priceUpper : priceLower?.invert()

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : undefined
  }, [isSorted, priceLower, priceUpper])

  const { dataMin, dataMax } = useMemo(() => {
    const sortedPairPrices = [...pairPrices].sort((a, b) => a.value - b.value)
    const minValue = sortedPairPrices[0]
    const maxValue = sortedPairPrices[sortedPairPrices.length - 1]
    return { dataMin: minValue?.value, dataMax: maxValue?.value }
  }, [pairPrices])

  const scrollIncrement = useMemo(() => (dataMax - dataMin) / 10, [dataMax, dataMin])

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
  // const sortedFormattedData = useMemo(
  //   () =>
  //     pairPrices
  //       ?.sort((a, b) => a.price0 - b.price0)
  //       .map(item => ({
  //         ...item,
  //         activeLiquidity: item.time.getTime(),
  //       })),
  //   [pairPrices],
  // )

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
            dispatch(updateSelectedPreset({ preset: null }))
          }

          if ((!ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] || mode === 'reset') && rightRangeValue > 0) {
            // todo: remove this check. Upper bound for large numbers
            // sometimes fails to parse to tick.
            if (rightRangeValue < 1e35) {
              onRightRangeInput(rightRangeValue.toFixed(6))
              dispatch(updateSelectedPreset({ preset: null }))
            }
          }
        })
      }
    },
    [boundaryPrices, handleShow, ticksAtLimit, isSorted, onLeftRangeInput, dispatch, onRightRangeInput],
  )

  // eslint-disable-next-line unused-imports/no-unused-vars
  interactive = interactive && Boolean(pairPrices?.length)

  const brushLabelValue = useCallback(
    (d, x) => {
      let priceVal = price
      if (!priceVal) {
        priceVal = pairPrices[pairPrices.length - 1]?.value
      }

      if (!priceVal) return ''

      if (d === 'w' && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]) return '0'
      if (d === 'e' && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]) return '∞'

      const percent = (x < priceVal ? -1 : 1) * ((Math.max(x, priceVal) - Math.min(x, priceVal)) / priceVal) * 100

      return priceVal ? `${(Math.sign(percent) < 0 ? '-' : '') + formatDelta(percent)}` : ''
    },
    [isSorted, pairPrices, price, ticksAtLimit],
  )

  const chartSize = useMemo(
    () => ({
      chartContainerWidth: containerRef?.current?.offsetWidth || 300,
      chartContainerHeight: containerRef?.current?.offsetHeight || height,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [containerRef?.current, windowSize],
  )

  useEffect(() => {
    if (
      isOutOfView &&
      zoomFactor === 1 &&
      !isFullRange &&
      priceLower &&
      priceUpper &&
      // Full Range
      Number(priceLower.toSignificant(6)) > 2.9543e-39 &&
      Number(priceUpper.toSignificant(6)) < 3.3849e38
    ) {
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
  }, [isOutOfView, zoomFactor, isFullRange, priceLower, priceUpper])

  useEffect(() => {
    const pairPricesLength = pairPrices.length
    if (pairPricesLength > 0) {
      setMidPrice(
        !isCreate ? pairPrices[pairPricesLength - 1]?.value : price ?? pairPrices[pairPricesLength - 1]?.value,
      )
    }
  }, [isCreate, pairPrices, price])

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
    if (!container) return

    let lastCall = 0
    const throttleDelayMs = 50

    const handleScroll = direction => {
      if (direction === 'up') {
        setMidPrice(prev => (prev ? prev + scrollIncrement : undefined))
      } else if (direction === 'down' && minVisiblePrice > 0) {
        setMidPrice(prev => (prev ? prev - scrollIncrement : undefined))
      }
    }

    const wheelListener = event => {
      event.preventDefault()
      event.stopPropagation()

      const now = Date.now()
      if (now - lastCall >= throttleDelayMs) {
        lastCall = now
        if (event.deltaY < 0) {
          handleScroll('up')
        } else if (event.deltaY > 0) {
          handleScroll('down')
        }
      }
    }

    container.addEventListener('wheel', wheelListener)

    return () => {
      container.removeEventListener('wheel', wheelListener)
    }
  }, [enableScroll, minVisiblePrice, scrollIncrement])

  useEffect(() => {
    if (!startPriceTypedValue && pairPrices?.length > 0) {
      setLastPrice(pairPrices[pairPrices.length - 1]?.value)
    }
  }, [pairPrices, setLastPrice, startPriceTypedValue, isReverse])

  return (
    <div className='flex flex-col'>
      <div className='flex flex-col justify-between gap-2 md:flex-row md:gap-4'>
        <NewTextHeading className={cn('hidden text-base md:text-xl lg:block', classNames?.title)}>
          {t(label ?? 'Your Range against the Price')}
        </NewTextHeading>
        <div className='flex items-center justify-between gap-4 lg:hidden'>
          <TextHeading className={cn('text-xl text-neutral-50')}>{t('Your Range APR')}</TextHeading>
          {presetRange && (
            <TextHeading className={cn('text-primary-600 text-xl')}>
              {formatAmount(APRs?.[presetRange?.type])}%
            </TextHeading>
          )}
        </div>
        <div className='flex items-center gap-4 max-md:justify-between'>
          {showPeriod && <Tabs data={periods} />}
          <div className='z-40 hidden gap-2 lg:flex'>
            <EmphasisIconButton
              className='lg:size-8'
              classNames='lg:size-4 stroke-neutral-400'
              Icon={ZoomInIcon}
              onClick={() => {
                setZoomFactor(prevZoomFactor => prevZoomFactor * 1.2)
              }}
              disabled={false}
            />
            <EmphasisIconButton
              className='lg:size-8'
              classNames='lg:size-4 stroke-neutral-400'
              Icon={ZoomOutIcon}
              onClick={() => {
                setZoomFactor(prevZoomFactor => prevZoomFactor / 1.2)
              }}
              disabled={false}
            />
          </div>
          <EmphasisButton
            className='flex h-8 gap-1 bg-transparent p-2! text-neutral-500'
            onClick={() => {
              setZoomFactor(1)
              setRange(2)
            }}
          >
            <RefreshIcon className='h-4 w-4 stroke-neutral-50' />
            {t('Reset')}
          </EmphasisButton>
        </div>
      </div>
      {isFullRange && fullRangeWarningShown && <Warning className='my-2 text-sm'>{t('Full range position')}</Warning>}
      {outOfRange && <Warning className='my-2 text-sm'>{t('Out range warning')}</Warning>}
      {invalidRange && <Warning className='my-2 text-sm'>{t('Invalid range warning')}</Warning>}
      <div className={cn('flex flex-col gap-2 md:gap-4', `max-h-[${height}px]`)}>
        <div className='relative flex h-[272px] w-full items-center justify-center lg:h-[235px]'>
          {isUninitialized ? (
            <TextHeading>{t('Your position will appear here')}</TextHeading>
          ) : isLoading || isLoadLiquidity ? (
            <Skeleton className={cn('absolute h-[calc(100%-48px)] w-full lg:h-full', `h-[${height}px]`)} />
          ) : error ? (
            <TextHeading>{t('Liquidity data not available')}</TextHeading>
          ) : (
            <div className={cn('flex h-full w-full flex-col gap-4', `max-h-[${height}px}]`)}>
              <div className='flex h-[calc(100%-48px)] w-full flex-col gap-8 lg:h-full' ref={containerRef}>
                <div ref={zoomRef} className='h-full w-full'>
                  <div
                    className='relative h-full w-full'
                    style={{
                      width: chartSize.chartContainerWidth,
                      height: chartSize.chartContainerHeight,
                    }}
                  >
                    <div
                      className='absolute inset-0 z-0 h-full'
                      style={{
                        width:
                          chartSize.chartContainerWidth -
                          desktopSizes.rightAxisWidth -
                          (windowSize.width > 768 ? 133 : 41),
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
                      {chartSize && formattedData?.length > 0 ? (
                        <ActivePriceRangeChart
                          maskColor={maskColor}
                          data={{
                            series: formattedData,
                            current: price ?? pairPrices[pairPrices.length - 1]?.value,
                            min: boundaryPrices?.[0],
                            max: boundaryPrices?.[1],
                          }}
                          dimensions={{
                            width: chartSize.chartContainerWidth,
                            height: chartSize.chartContainerHeight - (chartSize.chartContainerHeight * 0.2 + 28), // margin and time scale
                            contentWidth: chartSize.chartContainerWidth,
                            axisLabelPaneWidth: desktopSizes.rightAxisWidth,
                            padding: (chartSize.chartContainerHeight * 0.2 + 28) / 2,
                          }}
                          styles={{
                            area: { selection: '#BD60BA80' },
                            brush: { handle: { south: '#F199EE', north: '#F199EE' } },
                            disabled: {
                              handle: { south: '#35243D', north: '#35243D' },
                              line: { south: '#685770', north: '#685770' },
                            },
                          }}
                          interactive={interactive}
                          brushLabels={brushLabelValue}
                          brushDomain={brushDomain}
                          onBrushDomainChange={onBrushDomainChangeEnded}
                          handleShow={handleShow && brushDomain && chartPriceFinishedRender}
                          setIsOutOfView={setIsOutOfView}
                          isOutOfView={isOutOfView}
                          isFullRange={isFullRange}
                          setCurrentHover={setCurrentHover}
                          currentHover={currentHover}
                          id={idChart}
                          // setIsFlipped={setIsFlipped}
                          // container={zoomRef.current}
                          // triggerScroll={triggerScroll}
                        />
                      ) : (
                        <Skeleton className='h-full w-full' />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className='z-40 mx-auto flex h-8 w-fit gap-2 lg:hidden'>
                <EmphasisIconButton
                  className='lg:size-8'
                  classNames='lg:size-4 stroke-neutral-400'
                  Icon={ZoomInIcon}
                  onClick={() => {
                    setZoomFactor(prevZoomFactor => prevZoomFactor * 1.2)
                  }}
                  disabled={false}
                />
                <EmphasisIconButton
                  className='lg:size-8'
                  classNames='lg:size-4 stroke-neutral-400'
                  Icon={ZoomOutIcon}
                  onClick={() => {
                    setZoomFactor(prevZoomFactor => prevZoomFactor / 1.2)
                  }}
                  disabled={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
