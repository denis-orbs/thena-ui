import BigNumber from 'bignumber.js'
import React from 'react'

import { Paragraph } from '@/components/typography'
import { cn, formatAmount } from '@/lib/utils'

const COLORS = ['#DC00D4', '#B000AA', '#84007F', '#580055', '#2C002A']

function VotingPowerChart({ data, strokeWidth = 8, label = 'Total Voting Power' }) {
  const baseRadius = 60
  const spacing = 2
  let chartData = []
  const now = Math.floor(Date.now() / 1000)
  chartData = data.map((veTHE, index) => ({
    value: now - veTHE.lockedAt,
    max: veTHE.lockedEnd - veTHE.lockedAt,
    color: COLORS[index],
  }))
  if (data.length > 5) {
    const latestLockedEnd = Math.max(...data.slice(5).map(p => p.lockedEnd))
    chartData = [
      ...chartData.slice(0, 5),
      {
        value: now,
        max: latestLockedEnd,
        color: '#EA66E5',
      },
    ]
  }
  const totalRadius = baseRadius + (chartData.length - 1) * (strokeWidth + spacing)
  const center = totalRadius + strokeWidth / 2

  const polarToCartesian = (radius, angle) => ({
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  })

  const describeArc = (radius, value, max, color) => {
    const percent = Math.min(value / max, 1)
    const startAngle = -Math.PI
    const endAngle = startAngle + Math.PI * percent

    const start = polarToCartesian(radius, startAngle)
    const end = polarToCartesian(radius, endAngle)
    const maxEnd = polarToCartesian(radius, 0)

    return (
      <g key={color + value}>
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${0} 1 ${maxEnd.x} ${maxEnd.y}`}
          stroke='#281B2E'
          strokeWidth={strokeWidth}
          fill='none'
        />
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${0} 1 ${end.x} ${end.y}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill='none'
        />
      </g>
    )
  }

  const totalValue = data.reduce((sum, veTHE) => sum.plus(veTHE.voting_amount), new BigNumber(0))

  return (
    <div className='relative' style={{ width: '100%', height: '100%' }}>
      <svg
        className='border-b border-b-neutral-700'
        width='100%'
        height='100%'
        viewBox={`0 0 ${center * 2} ${center}`}
        preserveAspectRatio='xMidYMid meet'
      >
        {[...chartData].map((seg, index) => {
          const radius = baseRadius + (chartData.length - 1 - index) * (strokeWidth + spacing)
          return <React.Fragment key={index}>{describeArc(radius, seg.value, seg.max, seg.color)}</React.Fragment>
        })}
      </svg>

      <div className={cn('absolute bottom-0 left-0 right-0 text-center')}>
        <div className='text-3xl font-bold text-primary-300'>{formatAmount(totalValue)}</div>
        <Paragraph className='text-sm text-neutral-50'>{label}</Paragraph>
      </div>
    </div>
  )
}

export default VotingPowerChart
