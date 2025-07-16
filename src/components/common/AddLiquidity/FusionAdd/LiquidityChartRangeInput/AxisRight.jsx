import { axisRight, select } from 'd3'
import React, { useCallback, useMemo } from 'react'

import './style.css'

import { formatPrice } from '@/lib/utils'

const labelWidth = 55
const labelHeight = 28
const paddingY = 6

function Axis({ axisGenerator }) {
  const axisRef = axis => {
    // eslint-disable-next-line no-unused-expressions
    axis &&
      select(axis)
        .call(axisGenerator)
        .call(g => g.select('.domain').remove())
  }

  return <g className='axis-right-ref' ref={axisRef} />
}

export function AxisRight({ yScale, offset = 0, min, current, max, currentHover, padding, height, maskColor }) {
  const tickFormat = useCallback(d => {
    const str = d.toString()
    let decimal = 1
    if (str.includes('.')) {
      decimal = Number(`0.${str.split('.')[1]}`)
    }
    return `${decimal <= 1e-5 ? d.toExponential(0) : formatPrice(d)}`
  }, [])

  const axisGenerator = useMemo(() => {
    const tickValues = yScale.ticks(4).filter(tick => tick >= 0)
    return axisRight(yScale).tickValues(tickValues).tickFormat(tickFormat)
  }, [tickFormat, yScale])

  const [minY, maxY, currentY] = useMemo(() => {
    const minValue = min !== undefined && min > 0 ? yScale(min) : undefined
    const maxValue = max !== undefined && max > 0 ? yScale(max) : undefined
    const currentValue = current !== undefined && current > 0 ? yScale(current) : undefined
    return [minValue, maxValue, currentValue]
  }, [current, max, min, yScale])

  const currentLabel = useMemo(
    () => (current !== undefined ? `${current <= 1e-5 ? current.toExponential(0) : formatPrice(current)}` : ''),
    [current],
  )

  const renderHoverLines = useCallback(
    (y, direction, markerId) => {
      if (currentHover === direction) {
        const offsets = [-20, -15, -10, -5]
        return offsets.map((x1, idx) => (
          <line
            key={`${direction}-${idx}`}
            x1={x1}
            x2={x1 + 2}
            y1={y}
            y2={y}
            stroke='#F199EE'
            strokeWidth='2'
            markerStart={`url(#${markerId})`}
          />
        ))
      }
      return <line x1={40} x2={5} y1={y} y2={y} stroke='#F199EE' strokeWidth='2' markerStart={`url(#${markerId})`} />
    },
    [currentHover],
  )

  return (
    <>
      <g className='axis-right' transform={`translate(${offset + 5}, 0)`}>
        <defs>
          <marker
            id='arrow-min'
            markerWidth='5'
            markerHeight='5'
            refX='4'
            refY='2.5'
            orient='auto'
            markerUnits='strokeWidth'
          >
            {currentHover !== 'south' && !isNaN(minY) && <path d='M0,0 L0,5 L5,2.5 z' fill='#F199EE' />}
          </marker>
          <marker
            id='arrow-max'
            markerWidth='5'
            markerHeight='5'
            refX='4'
            refY='2.5'
            orient='auto'
            markerUnits='strokeWidth'
          >
            {currentHover !== 'north' && !isNaN(maxY) && <path d='M0,0 L0,5 L5,2.5 z' fill='#F199EE' />}
          </marker>
        </defs>
        {!isNaN(minY) && renderHoverLines(minY, 'south', 'arrow-min')}
        {!isNaN(maxY) && renderHoverLines(maxY, 'north', 'arrow-max')}
        <Axis axisGenerator={axisGenerator} />
        {!isNaN(currentY) && (
          <g style={{ padding: '6px' }}>
            <rect
              x={2}
              y={currentY - labelHeight / 2}
              width={labelWidth}
              height={labelHeight}
              rx='10'
              ry='10'
              fill='#F8CCF6'
            />
            <text x={(5 + labelWidth) / 2} y={currentY + paddingY / 2} textAnchor='middle' fontSize='12' fill='#685770'>
              {currentLabel}
            </text>
          </g>
        )}
        {!isNaN(minY) && currentHover === 'south' && (
          <>
            <g className='min-label-container'>
              <rect
                x={2}
                y={minY - labelHeight / 2}
                width={labelWidth}
                height={labelHeight}
                rx='10'
                ry='10'
                fill='#292929'
              />
              <text x={(5 + labelWidth) / 2} y={minY + paddingY / 2} textAnchor='middle' fontSize='12' fill='#F199EE'>
                {min <= 1e-5 ? min.toExponential(0) : formatPrice(min)}
              </text>
            </g>
          </>
        )}

        {!isNaN(maxY) && currentHover === 'north' && (
          <g className='max-label-container' style={{ padding: '6px' }} markerStart='url(#arrow-max)'>
            <rect
              x={2}
              y={maxY - labelHeight / 2}
              width={labelWidth}
              height={labelHeight}
              rx='10'
              ry='10'
              fill='#292929'
            />
            <text x={(5 + labelWidth) / 2} y={maxY + paddingY / 2} textAnchor='middle' fontSize='12' fill='#F199EE'>
              {max <= 1e-3 ? max.toExponential(0) : formatPrice(max)}
            </text>
          </g>
        )}
        <rect x='0' y={-padding} width='100%' height={padding} fill={maskColor} />
        <rect x='0' y={height} width='100%' height={padding * 2} fill={maskColor} />
      </g>
    </>
  )
}
