import { axisBottom, select } from 'd3'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'

import './style.css'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'

function Axis({ axisGenerator }) {
  const axisRef = axis => {
    if (axis) {
      select(axis)
        .call(axisGenerator)
        .call(g => g.select('.domain').remove())
        .selectAll('.tick text')
        .style('font-family', 'Inter')
        .style('font-weight', '500')
        .style('font-size', '12px')
        .style('line-height', '16px')
        .style('letter-spacing', '0%')
        .style('fill', '#685770')
    }
  }

  return <g ref={axisRef} />
}

export const AxisBottomTime = ({ xScale, innerHeight, offset = 0, timeWindow }) => {
  const { isMdDown } = useMediaQuery()
  return useMemo(() => {
    const tickFormat = d => {
      if (timeWindow === PairDataTimeWindow.DAY) {
        return dayjs(d).format('HH:mm')
      }
      return dayjs(d).format('MMM D')
    }
    return (
      <g className='axis-bottom' transform={`translate(0, ${innerHeight - offset})`}>
        <Axis
          axisGenerator={axisBottom(xScale)
            .ticks(isMdDown ? 4 : 6)
            .tickFormat(tickFormat)}
        />
      </g>
    )
  }, [innerHeight, offset, xScale, timeWindow, isMdDown])
}
