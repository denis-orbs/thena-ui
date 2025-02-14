import React, { useMemo } from 'react'

export const Line = ({ value, xScale, innerHeight }) =>
  useMemo(
    () => (
      <line
        className='fill-none stroke-primary-200 stroke-2 opacity-50'
        x1={xScale(value)}
        y1='0'
        x2={xScale(value)}
        y2={innerHeight}
      />
    ),
    [value, xScale, innerHeight],
  )
