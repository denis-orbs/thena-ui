import { axisBottom, select } from 'd3'
import React, { useMemo } from 'react'

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

export const AxisBottom = ({ xScale, innerHeight, offset = 0 }) =>
  useMemo(
    () => (
      <g className='axis-bottom' transform={`translate(0, ${innerHeight + offset})`}>
        <Axis axisGenerator={axisBottom(xScale).ticks(6)} />
      </g>
    ),
    [innerHeight, offset, xScale],
  )
