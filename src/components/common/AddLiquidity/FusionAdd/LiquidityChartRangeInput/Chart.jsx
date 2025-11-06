import { max, scaleLinear } from 'd3'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { EmphasisButton } from '@/components/buttons/Button'
import { NewTextHeading } from '@/components/typography'
import { Bound } from '@/state/fusion/actions'
import { Presets } from '@/state/fusion/reducer'

import ResetIcon from '~/svgs/reset.svg'

import { Area } from './Area'
import { AxisBottom } from './AxisBottom'
import { Brush } from './Brush'
import { Line } from './Line'
import Zoom from './Zoom'

const xAccessor = d => d.price0
const yAccessor = d => d.activeLiquidity

export function Chart({
  id = 'liquidityChartRangeInput',
  label,
  data: { series, current },
  ticksAtLimit,
  styles,
  dimensions: { width, height },
  margins,
  interactive = true,
  brushDomain,
  brushLabels,
  onBrushDomainChange,
  zoomLevels,
  handleShow,
  showZoom = true,
  isFixed = false,
  chartHeight = 221,
  isStablecoinPair = false,
  priceLower,
  priceUpper,
}) {
  const t = useTranslations()
  const zoomRef = useRef(null)
  const { preset } = useSelector(state => state.fusion)

  const [zoom, setZoom] = useState(null)

  const isFullRange = useMemo(() => preset === Presets.FULL, [preset])

  const initZoomLevels = useMemo(
    () => ({
      min: isStablecoinPair ? zoomLevels.stableMin : zoomLevels.initialMin,
      max: isStablecoinPair ? zoomLevels.stableMax : zoomLevels.initialMax,
    }),
    [isStablecoinPair, zoomLevels.initialMax, zoomLevels.initialMin, zoomLevels.stableMax, zoomLevels.stableMin],
  )

  const [innerHeight, innerWidth] = useMemo(
    () => [height - margins.top - margins.bottom, width - margins.left - margins.right],
    [width, height, margins],
  )

  const [leftDomain, rightDomain] = useMemo(() => {
    if (isFixed && priceLower && priceUpper) {
      return [priceLower.toSignificant() * 0.5, priceUpper.toSignificant() * 1.5]
    }

    let midPrice = current
    const filteredSeries = series.filter(item => item.price0 < 1e10).sort((a, b) => a.price0 - b.price0)
    const seriesLength = filteredSeries.length

    if (seriesLength > 1) {
      let midIndex = Math.floor(seriesLength / 2)
      if (seriesLength > 50) {
        midIndex = filteredSeries.reduce(
          (maxIdx, item, idx) => (item.activeLiquidity > filteredSeries[maxIdx].activeLiquidity ? idx : maxIdx),
          0,
        )
      }
      midPrice = filteredSeries[midIndex].price0
    }

    return [midPrice * initZoomLevels.min, midPrice * initZoomLevels.max]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, JSON.stringify(series), initZoomLevels.min, initZoomLevels.max, priceLower, priceUpper])

  const { xScale, yScale } = useMemo(() => {
    const scales = {
      xScale: scaleLinear().domain([leftDomain, rightDomain]).range([0, innerWidth]),
      yScale: scaleLinear()
        .domain([0, max(series, yAccessor)])
        .range([innerHeight, 0]),
    }

    if (zoom) {
      const newXscale = zoom.rescaleX(scales.xScale)
      scales.xScale.domain(newXscale.domain())
    }

    return scales
  }, [leftDomain, rightDomain, innerWidth, series, innerHeight, zoom])

  const { brushXScale } = useMemo(() => {
    const scales = scaleLinear()
      .domain([current * initZoomLevels.min, current * initZoomLevels.max])
      .range([0, innerWidth])

    if (zoom) {
      const newXscale = zoom.rescaleX(scales)
      scales.domain(newXscale.domain())
    }

    return { brushXScale: scales }
  }, [current, initZoomLevels.min, initZoomLevels.max, innerWidth, zoom])

  useEffect(() => {
    // reset zoom as necessary
    setZoom(null)
  }, [zoomLevels])

  useEffect(() => {
    if (!brushDomain) {
      onBrushDomainChange(brushXScale.domain(), undefined)
    }
  }, [brushDomain, brushXScale, onBrushDomainChange, xScale])

  return (
    <div className='flex h-full flex-col gap-4'>
      <div className='flex items-center justify-between gap-4 md:gap-8'>
        {label && <NewTextHeading className='text-xl!'>{t(label)}</NewTextHeading>}

        <div className='flex gap-4'>
          {showZoom && (
            <Zoom
              svg={zoomRef.current}
              xScale={xScale}
              setZoom={setZoom}
              width={innerWidth}
              height={
                // allow zooming inside the x-axis
                height
              }
              resetBrush={() => {
                onBrushDomainChange([current * zoomLevels.initialMin, current * zoomLevels.initialMax], 'reset')
              }}
              showResetButton={Boolean(ticksAtLimit[Bound.LOWER] || ticksAtLimit[Bound.UPPER])}
              zoomLevels={zoomLevels}
            />
          )}
          <EmphasisButton
            className='flex h-8 gap-1 bg-transparent p-2! text-xs! text-neutral-400!'
            onClick={() => {
              setZoom(null)
            }}
          >
            <ResetIcon className='size-4' />
            {t('Reset')}
          </EmphasisButton>
        </div>
      </div>

      <div className='mt-auto content-center justify-center' style={{ height: `${chartHeight}px` }}>
        <svg width='100%' height='100%' viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          <defs>
            <clipPath id={`${id}-chart-clip`}>
              <rect x='0' y='0' width={innerWidth} height={height} />
            </clipPath>

            {brushDomain && (
              // mask to highlight selected area
              <mask id={`${id}-chart-area-mask`}>
                <rect
                  fill='white'
                  x={xScale(brushDomain[0])}
                  y='0'
                  width={xScale(brushDomain[1]) - xScale(brushDomain[0])}
                  height={innerHeight}
                />
              </mask>
            )}
          </defs>

          <g transform={`translate(${margins.left},0)`}>
            <g clipPath={`url(#${id}-chart-clip)`}>
              <Area series={series} xScale={xScale} yScale={yScale} xValue={xAccessor} yValue={yAccessor} />

              {brushDomain && (
                // duplicate area chart with mask for selected area
                <g mask={`url(#${id}-chart-area-mask)`}>
                  <Area
                    series={series}
                    xScale={xScale}
                    yScale={yScale}
                    xValue={xAccessor}
                    yValue={yAccessor}
                    fill={styles.area.selection}
                  />
                </g>
              )}

              <Line value={current} xScale={xScale} innerHeight={innerHeight} />

              {/* Add triangle marker */}
              <path
                d={`M ${xScale(current) - 6} ${innerHeight + 12} L ${xScale(current) + 6} ${
                  innerHeight + 12
                } L ${xScale(current)} ${innerHeight} Z`}
                fill='#F8CCF6'
              />

              <line x1={0} x2={innerWidth} y1={innerHeight + 3} y2={innerHeight + 3} stroke='#685770' strokeWidth={2} />

              <AxisBottom xScale={xScale} innerHeight={innerHeight} />
            </g>

            {handleShow && (
              <Brush
                id={id}
                xScale={xScale}
                interactive={interactive}
                brushLabelValue={brushLabels}
                brushExtent={brushDomain ?? brushXScale.domain()}
                innerWidth={innerWidth}
                innerHeight={innerHeight}
                setBrushExtent={onBrushDomainChange}
                westHandleColor={interactive ? styles.brush.handle.west : '#35243D'}
                eastHandleColor={interactive ? styles.brush.handle.east : '#35243D'}
                isFullRange={isFullRange}
                setZoom={setZoom}
              />
            )}

            <rect
              className='size-full cursor-grab fill-transparent active:cursor-grabbing'
              width={innerWidth}
              height={height}
              ref={zoomRef}
            />
          </g>
        </svg>
      </div>
    </div>
  )
}
