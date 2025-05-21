import { axisBottom, select } from 'd3'
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
        .selectAll('.tick text')
        .style('font-size', '16px')
  }

  return <g ref={axisRef} />
}

const tickFormat = d => {
  const str = d.toString()
  let decimal = 1
  if (str.includes('.')) {
    decimal = Number(`0.${str.split('.')[1]}`)
  }
  return `${decimal <= 1e-5 ? d.toExponential(0) : formatAmount(d, true, 5, false)}`
}

export const AxisBottom = ({ xScale, innerHeight, offset = 0 }) =>
  useMemo(
    () => (
      <g className='axis-bottom' transform={`translate(0, ${innerHeight + offset})`}>
        <Axis axisGenerator={axisBottom(xScale).ticks(5).tickFormat(tickFormat)} />
      </g>
    ),
    [innerHeight, offset, xScale],
  )
