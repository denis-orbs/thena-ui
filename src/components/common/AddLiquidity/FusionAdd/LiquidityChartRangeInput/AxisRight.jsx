import { axisRight, select } from 'd3'
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

export const AxisRight = ({ yScale }) =>
  useMemo(
    () => (
      <g className='axis-bottom' transform='translate(0, 0)'>
        <Axis axisGenerator={axisRight(yScale).ticks(6)} />
      </g>
    ),
    [yScale],
  )
