import React from 'react'

export function HorizontalLine({ value, yScale, width, containerWidth, lineStyle = 'dashed' }) {
  const lineStart = containerWidth - width
  if (isNaN(lineStart)) {
    return null
  }

  const strokeDasharray = lineStyle === 'dashed' ? '1, 2' : 'none'
  return (
    <line
      className='fill-none stroke-[#F299EE] stroke-2 opacity-50'
      y1={yScale(value) - 1}
      x1={lineStart}
      y2={yScale(value) - 1}
      x2={lineStart + width}
      strokeDasharray={strokeDasharray}
    />
  )
}
