import { axisRight, select } from 'd3'
import React from 'react'

import './style.css'

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

// const TEXT_Y_OFFSET = 5

export function AxisRight({ yScale, offset = 0 }) {
  return (
    <g className='axis-bottom khanhnt' transform={`translate(${offset}, 0)`}>
      <Axis axisGenerator={axisRight(yScale).ticks(6)} yScale={yScale} />
    </g>
  )
}
