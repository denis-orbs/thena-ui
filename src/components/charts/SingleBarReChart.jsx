import React from 'react'

function SingleBarReChart({ borderColor, ...props }) {
  const { fill, x, y, width, height } = props
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} stroke='none' fill={fill} />
      <rect x={x} y={y} width={width} height={1} stroke='none' fill={borderColor} />
    </g>
  )
}

export default SingleBarReChart
