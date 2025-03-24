import React from 'react'

export function HorizontalLine({ value, yScale, width, containerWidth, lineStyle = 'dashed' }) {
  const lineStart = containerWidth - width
  if (isNaN(lineStart)) {
    return null
  }

  const strokeDasharray = lineStyle === 'dashed' ? '1, 4' : 'none'
  return (
    <line
      className='fill-none stroke-[#F8CCF6] stroke-1 opacity-50'
      y1={yScale(value)}
      x1={lineStart}
      y2={yScale(value)}
      x2={lineStart + width}
      strokeDasharray={strokeDasharray}
    />
  )
}
