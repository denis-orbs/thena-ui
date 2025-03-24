import { max, scaleLinear } from 'd3'
import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import { Presets } from '@/state/fusion/reducer'

import { AxisRight } from './AxisRight'
import { Brush2 } from './Brush2'
import { HorizontalArea } from './HorizontalArea'
import { HorizontalLine } from './HorizontalLine'

const xAccessor = d => d.price0
const yAccessor = d => d.activeLiquidity

export default function ActiveLiquidityChart({
  id = 'liquidityChartRangeInput',
  data: { series, current },
  styles,
  dimensions: { width, height, contentWidth, axisLabelPaneWidth },
  margins,
  interactive = true,
  brushDomain,
  brushLabels,
  onBrushDomainChange,
  zoomLevels,
  handleShow,
  disableBrush = false,
}) {
  const svgRef = useRef(null)
  // const [hoverY, setHoverY] = useState()
  const { preset } = useSelector(state => state.fusion)

  const isFullRange = useMemo(() => preset === Presets.FULL, [preset])

  const [innerWidth] = useMemo(
    () => [height - margins.top - margins.bottom, width - margins.left - margins.right],
    [width, height, margins],
  )

  const { xScale, yScale } = useMemo(() => {
    const scales = {
      xScale: scaleLinear()
        .domain([0, max(series, xAccessor)])
        .range([0, width]),
      yScale: scaleLinear()
        .domain([
          current * (isFullRange ? 0.2 : zoomLevels.initialMin),
          current * (isFullRange ? 1.6 : zoomLevels.initialMax),
        ])
        .range([height, 0]),
    }

    return scales
  }, [series, width, current, isFullRange, zoomLevels.initialMin, zoomLevels.initialMax, height])

  useEffect(() => {
    if (!brushDomain) {
      const [minValue, maxValue] = yScale.domain()
      const lowerBound = minValue + (maxValue - minValue) * 0.2
      const upperBound = minValue + (maxValue - minValue) * 0.8
      onBrushDomainChange([lowerBound, upperBound], undefined)
    }
  }, [brushDomain, onBrushDomainChange, yScale])

  // const southHandleInView = brushDomain && yScale(brushDomain[0]) >= 0 && yScale(brushDomain[0]) <= height
  // const northHandleInView = brushDomain && yScale(brushDomain[1]) >= 0 && yScale(brushDomain[1]) <= height

  return (
    <>
      <svg
        width='100%'
        height='100%'
        viewBox={`0 0 ${width} ${height}`}
        ref={svgRef}
        // onMouseMove={event => {
        //   if (!svgRef.current) {
        //     return
        //   }
        //   const rect = svgRef.current?.getBoundingClientRect()
        //   // const y = event.clientY - rect.top
        //   const x = event.clientX - rect.left
        //   if (x > width - axisLabelPaneWidth - contentWidth) {
        //     // setHoverY(y)
        //   } else {
        //     // setHoverY(undefined)
        //   }
        // }}
        // onMouseLeave={() => setHoverY(undefined)}
      >
        <defs>
          <clipPath id={`${id}-chart-clip`}>
            <rect x='0' y='0' width={innerWidth} height={height} />
          </clipPath>

          {brushDomain && (
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
            {/* <Area series={series} xScale={xScale} yScale={yScale} xValue={xAccessor} yValue={yAccessor} /> */}
            <HorizontalArea
              series={series}
              xScale={xScale}
              yScale={yScale}
              xValue={xAccessor}
              yValue={yAccessor}
              brushDomain={brushDomain}
              // fill={opacify(100, brushDomain ? colors.neutral1.val : barColor ?? colors.accent1.val)}
              // selectedFill={opacify(isMobile ? 10 : 100, barColor ?? colors.accent1.val)}
              containerHeight={height}
              containerWidth={width - axisLabelPaneWidth}
            />
            {!disableBrush && (
              <HorizontalLine
                value={current}
                yScale={yScale}
                width={contentWidth + 12}
                containerWidth={width - axisLabelPaneWidth}
              />
            )}

            <AxisRight
              yScale={yScale}
              min={brushDomain?.[0]}
              current={current}
              max={brushDomain?.[1]}
              width={0}
              offset={0}
            />
          </g>

          {/* <rect
            className='size-full cursor-grab fill-transparent active:cursor-grabbing'
            width={innerWidth}
            height={height}
            ref={zoomRef}
          /> */}
          {handleShow && (
            <Brush2
              id={id}
              yScale={yScale}
              interactive={interactive}
              brushLabelValue={brushLabels}
              brushExtent={brushDomain ?? yScale.domain()}
              hideHandles={!brushDomain}
              width={width - axisLabelPaneWidth}
              height={height}
              setBrushExtent={onBrushDomainChange}
              northHandleColor={styles.brush.handle.north}
              southHandleColor={styles.brush.handle.south}
            />
          )}
        </g>
      </svg>
    </>
  )
}
