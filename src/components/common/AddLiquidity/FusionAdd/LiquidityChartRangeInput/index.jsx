import { useCallback, useMemo } from 'react'
import { batch } from 'react-redux'

import Spinner from '@/components/spinner'
import { TextHeading } from '@/components/typography'
import { Bound } from '@/state/fusion/actions'

import { Chart } from './Chart'
import { useDensityChartData } from './hooks'

const ZOOM_LEVEL = {
  initialMin: 0.9,
  initialMax: 1.1,
  min: 0.00001,
  max: 20,
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

export default function LiquidityChartRangeInput({
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

  const { isLoading, error, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })

  const onBrushDomainChangeEnded = useCallback(
    (domain, mode) => {
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
    [isSorted, onLeftRangeInput, onRightRangeInput, ticksAtLimit, handleShow],
  )

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

  const isUninitialized = !currencyA || !currencyB || (formattedData === undefined && !isLoading)

  return (
    <div className='flex min-h-[200px] w-full items-center justify-center'>
      {isUninitialized ? (
        <TextHeading>Your position will appear here.</TextHeading>
      ) : isLoading ? (
        <Spinner />
      ) : error ? (
        <TextHeading>Liquidity data not available.</TextHeading>
      ) : !formattedData || formattedData.length === 0 || !price ? (
        <TextHeading>There is no liquidity data.</TextHeading>
      ) : (
        <div className='relative h-[200px] w-full content-center justify-center'>
          <Chart
            data={{ series: formattedData, current: price }}
            dimensions={{ width: 560, height: 200 }}
            margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
            styles={{
              area: {
                selection: '#EA66E5',
              },
              brush: {
                handle: {
                  west: '#DC00D4',
                  east: '#DC00D4',
                },
              },
            }}
            interactive={interactive}
            brushLabels={brushLabelValue}
            brushDomain={brushDomain}
            onBrushDomainChange={onBrushDomainChangeEnded}
            zoomLevels={ZOOM_LEVEL}
            ticksAtLimit={ticksAtLimit}
            handleShow={handleShow}
          />
        </div>
      )}
    </div>
  )
}
