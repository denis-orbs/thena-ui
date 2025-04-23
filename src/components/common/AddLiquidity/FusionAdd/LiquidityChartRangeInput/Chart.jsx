import { max, scaleLinear } from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { Bound } from '@/state/fusion/actions'
import { Presets } from '@/state/fusion/reducer'

import { Area } from './Area'
import { AxisBottom } from './AxisBottom'
import { Brush } from './Brush'
import { Line } from './Line'
import Zoom from './Zoom'

const xAccessor = d => d.price0
const yAccessor = d => d.activeLiquidity

export function Chart({
  id = 'liquidityChartRangeInput',
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
}) {
  const zoomRef = useRef(null)

  const [zoom, setZoom] = useState(null)
  const { preset } = useSelector(state => state.fusion)

  const isFullRange = useMemo(() => preset === Presets.FULL, [preset])

  const [innerHeight, innerWidth] = useMemo(
    () => [height - margins.top - margins.bottom, width - margins.left - margins.right],
    [width, height, margins],
  )

  const { xScale, yScale } = useMemo(() => {
    const scales = {
      xScale: scaleLinear()
        .domain([
          current * (isFullRange ? 0.2 : zoomLevels.initialMin),
          current * (isFullRange ? 1.6 : zoomLevels.initialMax),
        ])
        .range([0, innerWidth]),
      yScale: scaleLinear()
        .domain([0, max(series, yAccessor)])
        .range([innerHeight, 0]),
    }

    if (zoom) {
      const newXscale = zoom.rescaleX(scales.xScale)
      scales.xScale.domain(newXscale.domain())
    }

    return scales
  }, [current, isFullRange, zoomLevels.initialMin, zoomLevels.initialMax, innerWidth, series, innerHeight, zoom])

  useEffect(() => {
    // reset zoom as necessary
    setZoom(null)
  }, [zoomLevels])

  useEffect(() => {
    if (!brushDomain) {
      onBrushDomainChange(xScale.domain(), undefined)
    }
  }, [brushDomain, onBrushDomainChange, xScale])

  return (
    <>
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

      <div className='h-[280px] content-center justify-center'>
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

              <AxisBottom xScale={xScale} innerHeight={innerHeight} />
            </g>

            <rect
              className='size-full cursor-grab fill-transparent active:cursor-grabbing'
              width={innerWidth}
              height={height}
              ref={zoomRef}
            />

            {handleShow && (
              <Brush
                id={id}
                xScale={xScale}
                interactive={interactive}
                brushLabelValue={brushLabels}
                brushExtent={brushDomain ?? xScale.domain()}
                innerWidth={innerWidth}
                innerHeight={innerHeight}
                setBrushExtent={onBrushDomainChange}
                westHandleColor={interactive ? styles.brush.handle.west : '#685770'}
                eastHandleColor={interactive ? styles.brush.handle.east : '#685770'}
                isFullRange={isFullRange}
              />
            )}
          </g>
        </svg>
      </div>
    </>
  )
}
