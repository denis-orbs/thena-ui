import { area, curveStepAfter } from 'd3'
import React, { useMemo } from 'react'

import { cn } from '@/lib/utils'

export const Area = ({ series, xScale, yScale, xValue, yValue, fill }) =>
  useMemo(
    () => (
      <path
        className={cn('fill-[#EA66E5] stroke-[#EA66E5]', !fill && 'opacity-50')}
        d={
          area()
            .curve(curveStepAfter)
            .x(d => xScale(xValue(d)))
            .y1(d => yScale(yValue(d)))
            .y0(yScale(0))(
            series.filter(d => {
              const value = xScale(xValue(d))
              return value > 0 && value <= window.innerWidth
            }),
          ) ?? undefined
        }
      />
    ),
    [fill, series, xScale, xValue, yScale, yValue],
  )
