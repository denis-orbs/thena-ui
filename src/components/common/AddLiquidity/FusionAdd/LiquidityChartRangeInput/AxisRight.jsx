import { axisRight, select } from 'd3'
import React, { useMemo } from 'react'

import './style.css'

import { formatAmount } from '@/lib/utils'

function Axis({ axisGenerator }) {
  const axisRef = axis => {
    // eslint-disable-next-line no-unused-expressions
    axis &&
      select(axis)
        .call(axisGenerator)
        .call(g => g.select('.domain').remove())
  }

  return <g ref={axisRef} />
}

const TEXT_Y_OFFSET = 5

export function AxisRight({ yScale, offset = 0, min, current, max, height }) {
  console.log({ yScale: yScale(min), offset, min, current, max, height })
  const tickValues = useMemo(() => {
    const minCoordinate = min ? yScale(min) : undefined
    const maxCoordinate = max ? yScale(max) : undefined
    const currentCoordinate = current ? yScale(current) : undefined
    if (minCoordinate && currentCoordinate && Math.abs(minCoordinate - currentCoordinate) < TEXT_Y_OFFSET) {
      return [min, max].filter(Boolean)
    }
    if (maxCoordinate && currentCoordinate && Math.abs(maxCoordinate - currentCoordinate) < TEXT_Y_OFFSET) {
      return [min, max].filter(Boolean)
    }
    return [min, current, max].filter(Boolean)
  }, [current, max, min, yScale])

  return (
    <g className='axis-bottom' transform={`translate(${offset}, 0)`}>
      <Axis
        axisGenerator={axisRight(yScale)
          .tickValues(tickValues)
          .tickFormat(d => formatAmount(d))}
        height={height}
        yScale={yScale}
      />
    </g>
  )
}
