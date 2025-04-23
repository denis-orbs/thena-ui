import { axisRight, select } from 'd3'
import React, { useMemo } from 'react'

import './style.css' // File CSS thay thế cho styled-components

import { formatAmount } from '@/lib/utils'

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

export function AxisRight({ yScale, offset = 0, min, current, max }) {
  const tickFormat = d => {
    const str = d.toString()
    let decimal = 1
    if (str.includes('.')) {
      decimal = Number(`0.${str.split('.')[1]}`)
    }
    return `${decimal <= 1e-3 ? d.toExponential(0) : formatAmount(d, true, 5, false)}`
  }

  const axisGenerator = useMemo(() => {
    const tickValues = yScale.ticks(4)
    return axisRight(yScale).tickValues(tickValues).tickFormat(tickFormat)
  }, [yScale])
  const minY = min !== undefined ? yScale(min) : null
  const maxY = max !== undefined ? yScale(max) : null
  const currentY = current !== undefined ? yScale(current) : null
  const currentLabel =
    current !== undefined ? `${current <= 1e-3 ? current.toExponential(0) : formatAmount(current, true, 5, false)}` : ''
  const labelWidth = 55
  const labelHeight = 28
  const paddingY = 6
  return (
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
          <path d='M0,0 L0,5 L5,2.5 z' fill='#F199EE' />
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
          <path d='M0,0 L0,5 L5,2.5 z' fill='#F199EE' />
        </marker>
      </defs>
      {!isNaN(minY) && (
        <line
          x1={40}
          x2={5}
          y1={minY}
          y2={minY}
          fill='#F199EE'
          stroke='#F199EE'
          strokeWidth='2'
          markerStart='url(#arrow-min)'
        />
      )}
      {!isNaN(maxY) && (
        <line
          x1={40}
          x2={5}
          y1={maxY}
          y2={maxY}
          fill='#F199EE'
          stroke='#F199EE'
          strokeWidth='2'
          markerStart='url(#arrow-min)'
        />
      )}
      <Axis axisGenerator={axisGenerator} />
      {!isNaN(currentY) && (
        <g className='current-label-container' style={{ padding: '6px' }}>
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
    </g>
  )
}
