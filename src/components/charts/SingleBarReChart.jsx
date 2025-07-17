import React from 'react'

function SingleBarReChart({ ...props }) {
  const { x, y, width, height, fill, stroke = '#F299EE', strokeWidth = 1, rx = 4 } = props

  const radius = Math.min(rx, width / 2, height / 2)
  const right = x + width
  const bottom = y + height

  // Filled rect with top-rounded corners and no stroke
  const rectPath = `
    M ${x + radius},${y}
    H ${right - radius}
    Q ${right},${y} ${right},${y + radius}
    V ${bottom}
    H ${x}
    V ${y + radius}
    Q ${x},${y} ${x + radius},${y}
    Z
  `

  // Stroke-only path: top + left + right (no bottom!)
  const strokePath = `
    M ${x + radius},${y}
    H ${right - radius}
    Q ${right},${y} ${right},${y + radius}
    V ${bottom}
    M ${x},${bottom}
    V ${y + radius}
    Q ${x},${y} ${x + radius},${y}
  `

  return (
    <g>
      {/* Fill (with rounded top) */}
      <path d={rectPath} fill={fill} stroke='none' />
      {/* Stroke only top + left + right */}
      <path d={strokePath} fill='none' stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  )
}

export default SingleBarReChart
