import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { batch, useSelector } from 'react-redux'

import { useDensityChartData } from '@/components/common/AddLiquidity/FusionAdd/LiquidityChartRangeInput/hooks'
import Spinner from '@/components/spinner'
import Tabs from '@/components/tabs'
import { TextHeading } from '@/components/typography'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import { Bound } from '@/state/fusion/actions'

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
}) {
  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped)
  const [boundaryPrices, setBoundaryPrices] = useState()
  const { isLoading, error, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })

  const [timeWindow, setTimeWindow] = useState(PairDataTimeWindow.WEEK)
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

  const periods = useMemo(
    () => [
      {
        label: '24H',
        active: timeWindow === PairDataTimeWindow.DAY,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.DAY)
        },
      },
      {
        label: '1W',
        active: timeWindow === PairDataTimeWindow.WEEK,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.WEEK)
        },
      },
      {
        label: '1M',
        active: timeWindow === PairDataTimeWindow.MONTH,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.MONTH)
        },
      },
      {
        label: '1Y',
        active: timeWindow === PairDataTimeWindow.YEAR,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.YEAR)
        },
      },
    ],
    [timeWindow],
  )

  const {
    data: pairPrices = [],
    isLoading: isLoadingPairPrices,
    error: errorPairPrices,
  } = useFetchPairPrices({
    token0Address: baseCurrency.wrapped.address,
    token1Address: quoteCurrency.wrapped.address,
    timeWindow,
  })

  console.log({ formattedData, pairPrices })

  console.log({ isLoadingPairPrices, errorPairPrices })

  const [showDiffIndicators, setShowDiffIndicators] = useState(false)

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
      let leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      console.log({ leftRangeValue, rightRangeValue })

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
    [isSorted, onLeftRangeInput, onRightRangeInput, ticksAtLimit, handleShow],
  )

  // eslint-disable-next-line unused-imports/no-unused-vars
  interactive = interactive && Boolean(formattedData?.length)

  const brushDomain = useMemo(() => {
    const leftPrice = isSorted ? priceLower : priceUpper?.invert()
    const rightPrice = isSorted ? priceUpper : priceLower?.invert()

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : undefined
  }, [isSorted, priceLower, priceUpper])

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
      console.log({ width: containerRef?.current?.offsetWidth, height: containerRef?.current?.offsetHeight })
      setChartSize({
        chartContainerWidth: containerRef?.current?.offsetWidth,
        chartContainerHeight: containerRef?.current?.offsetHeight,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef?.current])

  const isUninitialized = !currencyA || !currencyB || (formattedData === undefined && !isLoading)

  return (
    <div className='flex flex-col gap-4'>
      <Tabs data={periods} />

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
            <div className='h-full w-full overflow-y-auto'>
              <div
                className='relative h-full w-full overflow-y-auto'
                style={{
                  width: chartSize?.chartContainerWidth,
                  height: chartSize?.chartContainerHeight || 300,
                }}
              >
                <div className='absolute inset-0 z-0'>
                  <Chart2
                    data={pairPrices}
                    timeWindow={timeWindow}
                    current={Number(price)}
                    setBoundaryPrices={setBoundaryPrices}
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
                      height: chartSize?.chartContainerHeight || 300,
                      contentWidth: desktopSizes.liquidityChartWidth,
                      axisLabelPaneWidth: desktopSizes.rightAxisWidth,
                    }}
                    showDiffIndicators={showDiffIndicators}
                    margins={{ top: 0, right: 0, bottom: 0, left: 0 }}
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
        )}
      </div>
    </div>
  )
}
