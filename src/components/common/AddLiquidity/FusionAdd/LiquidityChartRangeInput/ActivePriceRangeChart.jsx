import { max as getMax, scaleLinear } from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AxisRight } from './AxisRight'
import { Brush2 } from './Brush2'
import { HorizontalArea } from './HorizontalArea'
import { HorizontalLine } from './HorizontalLine'

const xAccessor = d => d.activeLiquidity
const yAccessor = d => d.price0

export default function ActivePriceRangeChart({
  id,
  data: { series, current, min, max },
  styles,
  dimensions: { width, height, padding, contentWidth, axisLabelPaneWidth },
  interactive = true,
  brushDomain,
  brushLabels,
  onBrushDomainChange,
  handleShow,
  disableBrush = false,
  setIsOutOfView,
  isFullRange = false,
  currentHover,
  container,
  setCurrentHover = () => {},
}) {
  const svgRef = useRef(null)
  const { xScale, yScale } = useMemo(() => {
    const activeEntries = min && max ? series.filter(d => d.price0 >= min && d.price0 <= max) : series
    const scales = {
      yScale: scaleLinear().domain([min, max]).range([height, 0]),
      xScale: scaleLinear()
        .domain([0, getMax(activeEntries, xAccessor)])
        .range([width - axisLabelPaneWidth, width - axisLabelPaneWidth - contentWidth]),
    }

    return scales
  }, [min, max, series, height, width, axisLabelPaneWidth, contentWidth])

  useEffect(() => {
    if (!brushDomain) {
      const [minValue, maxValue] = yScale.domain()
      const lowerBound = minValue + (maxValue - minValue) * 0.2
      const upperBound = minValue + (maxValue - minValue) * 0.8
      onBrushDomainChange([lowerBound, upperBound], undefined)
    }
  }, [brushDomain, onBrushDomainChange, yScale])

  const [liveLocalBrushExtent, setLiveLocalBrushExtent] = useState(brushDomain)

  return (
    <>
      <svg width='100%' height='100%' viewBox={`0 14 ${width} ${height}`} ref={svgRef}>
        <defs>
          <clipPath id={`${id}-chart-clip`}>
            <rect x='0' y='0' width={width} height={height} />
          </clipPath>

          <linearGradient id='gradient-brush-area' x1='0%' x2='100%' y1='0%' y2='0%'>
            <stop offset='6.2%' stopColor='#BD60BA' stopOpacity={0.5} />
            <stop offset='100%' stopColor='#83007E' stopOpacity={0} />
          </linearGradient>

          {brushDomain && yScale && yScale(brushDomain[0]) && yScale(brushDomain[1]) && (
            // mask to highlight selected area
            <mask id={`${id}-chart-area-mask`}>
              <rect
                fill='white'
                y={yScale(brushDomain[1])}
                x={width - axisLabelPaneWidth - contentWidth - 1}
                height={yScale(brushDomain[0]) - yScale(brushDomain[1])}
                width={contentWidth + 2}
              />
            </mask>
          )}
        </defs>

        <g>
          <g clipPath={`url(#${id}-chart-clip)`}>
            <HorizontalArea
              series={series}
              xScale={xScale}
              yScale={yScale}
              xValue={xAccessor}
              yValue={yAccessor}
              brushDomain={brushDomain}
              fill='url(#gradient-brush-area)'
              selectedFill='url(#gradient-brush-area)'
              containerHeight={height}
              containerWidth={width - axisLabelPaneWidth}
            />
            {!disableBrush && (
              <HorizontalLine
                value={current}
                yScale={yScale}
                width={contentWidth + 12}
                containerWidth={width}
                lineStyle='dashed'
              />
            )}
          </g>

          <AxisRight
            yScale={yScale}
            offset={width - axisLabelPaneWidth}
            current={current}
            min={liveLocalBrushExtent?.[0]}
            max={liveLocalBrushExtent?.[1]}
            currentHover={currentHover}
            padding={padding}
            height={height}
          />
          {handleShow && (
            <Brush2
              id={id}
              yScale={yScale}
              interactive={interactive}
              brushLabelValue={brushLabels}
              brushExtent={brushDomain ?? yScale.domain()}
              hideHandles={!brushDomain}
              width={width - axisLabelPaneWidth - 20}
              height={height}
              setBrushExtent={onBrushDomainChange}
              northHandleColor={styles.brush.handle.north}
              southHandleColor={styles.brush.handle.south}
              disableColor={styles.disabled}
              setIsOutOfView={setIsOutOfView}
              isFullRange={isFullRange}
              setCurrentHover={setCurrentHover}
              currentHover={currentHover}
              setLiveLocalBrushExtent={setLiveLocalBrushExtent}
              padding={padding}
              container={container}
            />
          )}
        </g>
      </svg>
    </>
  )
}
