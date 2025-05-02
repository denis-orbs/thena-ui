import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Divider from '@/components/divider'
import { Paragraph } from '@/components/typography'
import { cn, formatAmount, ZERO_VALUE } from '@/lib/utils'

const COLORS = ['#F199EE', '#EA66E5', '#E333DD', '#84007F', '#B000AA']
const baseRadius = 60
const baseStrokeWidth = 6
const spacing = 2

function VotingPowerChart({ data }) {
  const [selectedVethe, setSelectedVethe] = useState(null)

  const chartData = useMemo(() => {
    if (data.length > 5) {
      const res = [...data.slice(0, 5)].map((veTHE, index) => ({
        id: veTHE.id,
        value: veTHE.voting_amount.toNumber(),
        max: veTHE.amount.toNumber(),
        color: COLORS[index],
      }))

      const sliceData = data.slice(5)
      const totalValue = sliceData.reduce((sum, veTHE) => sum.plus(veTHE.voting_amount), ZERO_VALUE)
      const totalMax = sliceData.reduce((sum, veTHE) => sum.plus(veTHE.amount), ZERO_VALUE)
      res.push({
        id: 'Others',
        value: totalValue,
        max: totalMax,
        color: '#FCE6FB',
      })

      return res
    }

    return data.map((veTHE, index) => ({
      id: veTHE.id,
      value: veTHE.voting_amount.toNumber(),
      max: veTHE.amount.toNumber(),
      color: COLORS[index],
    }))
  }, [data])

  const strokeWidth = useMemo(() => baseStrokeWidth + (chartData.length - 1) * 2, [chartData.length])

  const totalRadius = useMemo(
    () => baseRadius + (chartData.length - 1) * (strokeWidth + spacing),
    [chartData.length, strokeWidth],
  )
  const center = useMemo(() => totalRadius + strokeWidth / 2, [totalRadius, strokeWidth])

  const polarToCartesian = useCallback(
    (radius, angle) => ({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }),
    [center],
  )

  const describeArc = useCallback(
    (seg, index) => {
      const { value, max, color } = seg
      const radius = baseRadius + (chartData.length - 1 - index) * (strokeWidth + spacing)
      const percent = Math.min(value / max, 1)
      const startAngle = -Math.PI
      const endAngle = startAngle + Math.PI * percent

      const start = polarToCartesian(radius, startAngle)
      const end = polarToCartesian(radius, endAngle)
      const maxEnd = polarToCartesian(radius, 0)

      return (
        <g
          key={color + value}
          className='group'
          onMouseOver={() => chartData.length !== 1 && setSelectedVethe(seg)}
          onMouseLeave={() => chartData.length !== 1 && setSelectedVethe(null)}
        >
          <path
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${0} 1 ${maxEnd.x} ${maxEnd.y}`}
            stroke='#281B2E'
            strokeWidth={strokeWidth}
            fill='none'
          />
          <path
            id='currentColor'
            className='group-hover:opacity-85'
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${0} 1 ${end.x} ${end.y}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill='none'
          />
        </g>
      )
    },
    [chartData.length, polarToCartesian, strokeWidth],
  )

  useEffect(() => {
    if (chartData.length === 1) {
      setSelectedVethe(chartData[0])
    }
  }, [chartData])

  return (
    <div className='relative' style={{ width: '100%', height: '100%' }}>
      <svg width='100%' height='100%' viewBox={`0 0 ${center * 2} ${center}`} preserveAspectRatio='xMidYMid meet'>
        {chartData.map((seg, index) => (
          <React.Fragment key={index}>{describeArc(seg, index)}</React.Fragment>
        ))}
      </svg>

      <Divider className='my-1 h-[2px] bg-neutral-700' />

      {selectedVethe && (
        <div className={cn('absolute bottom-2 left-0 right-0 text-center')}>
          <div className='flex items-center justify-center gap-2'>
            <div className='size-2 rounded-sm' style={{ background: selectedVethe.color }} />
            <Paragraph className='font-medium text-neutral-50 lg:text-sm'>ID #{selectedVethe.id}</Paragraph>
          </div>
          <Paragraph className='text-neutral-500 lg:text-sm'>Power {formatAmount(selectedVethe.value, true)}</Paragraph>
        </div>
      )}
    </div>
  )
}

export default VotingPowerChart
