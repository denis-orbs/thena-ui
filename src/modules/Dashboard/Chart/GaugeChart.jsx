import React from 'react'

function MultiGaugeChart({ segments, strokeWidth = 12, label = 'Total Voting Power' }) {
  const baseRadius = 60
  const spacing = 4
  const totalRadius = baseRadius + (segments.length - 1) * (strokeWidth + spacing)
  const center = totalRadius + strokeWidth

  const polarToCartesian = (radius, angle) => ({
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  })

  const describeArc = (radius, value, max, color) => {
    const percent = Math.min(value / max, 1)
    console.log({ percent })
    const startAngle = -Math.PI
    const endAngle = startAngle + Math.PI * percent

    const start = polarToCartesian(radius, startAngle)
    const end = polarToCartesian(radius, endAngle)
    const maxEnd = polarToCartesian(radius, 0)

    return (
      <g>
        <path
          key={color + value}
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${0} 1 ${maxEnd.x} ${maxEnd.y}`}
          stroke='#281B2E'
          strokeWidth={strokeWidth}
          fill='none'
          // strokeLinecap='round'
        />
        <path
          key={color + value}
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${0} 1 ${end.x} ${end.y}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill='none'
        />
      </g>
    )
  }

  const totalValue = segments[0]?.value || 0

  return (
    <div className='relative' style={{ width: '100%', height: '100%' }}>
      <svg width='100%' height='100%' viewBox={`0 0 ${center * 2} ${center + 20}`} preserveAspectRatio='xMidYMid meet'>
        {[...segments].reverse().map((seg, index) => {
          const radius = baseRadius + (segments.length - 1 - index) * (strokeWidth + spacing)
          return describeArc(radius, seg.value, seg.max, seg.color)
        })}
      </svg>

      <div className='absolute left-0 right-0 top-[60px] text-center'>
        <div className='text-2xl font-bold text-pink-400'>{totalValue.toLocaleString()}</div>
        <div className='text-sm text-white'>{label}</div>
      </div>
    </div>
  )
}

export default MultiGaugeChart
