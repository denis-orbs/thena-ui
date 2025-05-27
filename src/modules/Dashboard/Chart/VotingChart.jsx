import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'

import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import { PAIR_TYPES } from '@/constant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn, formatAmount } from '@/lib/utils'

const COLORS = ['#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F']
const GRAY_COLOR = '#281B2E'

// function formatDuration(seconds) {
//   const days = Math.floor(seconds / (3600 * 24))
//   const hours = Math.floor((seconds % (3600 * 24)) / 3600)
//   const minutes = Math.floor((seconds % 3600) / 60)
//   const secs = seconds % 60

//   const parts = []
//   if (days) parts.push(`${days}d`)
//   if (hours) parts.push(`${hours}h`)
//   if (minutes) parts.push(`${minutes}m`)
//   if (secs || parts.length === 0) parts.push(`${secs}s`)

//   return parts.join('')
// }

function getSecondsRelativeToThursdayUTC() {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  const second = now.getUTCSeconds()

  // number of seconds passed from week start (UTC)
  const secondsSinceWeekStart = dayOfWeek * 86400 + hour * 3600 + minute * 60 + second

  // thursday
  const thursdayStartSeconds = 4 * 86400

  let secondsSinceLastThursday
  let secondsUntilNextThursday

  if (secondsSinceWeekStart >= thursdayStartSeconds) {
    secondsSinceLastThursday = secondsSinceWeekStart - thursdayStartSeconds
    secondsUntilNextThursday = 7 * 86400 - secondsSinceLastThursday
  } else {
    secondsSinceLastThursday = 7 * 86400 - (thursdayStartSeconds - secondsSinceWeekStart)
    secondsUntilNextThursday = thursdayStartSeconds - secondsSinceWeekStart
  }

  return {
    sinceLastEpoch: secondsSinceLastThursday,
    untilNextEpoch: secondsUntilNextThursday,
  }
}

function VotingChart({ data = [], className }) {
  const { isMdDown } = useMediaQuery()

  const [hoveredIndex, setHoveredIndex] = useState(null)
  const chartRef = useRef(null)
  const originalColors = useRef([])
  const expectedRewards = useMemo(
    () => data.reduce((acc, cur) => acc.plus(cur.votes.rewards), new BigNumber(0)),
    [data],
  )

  const { sinceLastEpoch, untilNextEpoch } = getSecondsRelativeToThursdayUTC()

  const formatData = () => {
    const result = data.map(d => {
      const value = d.votes.weightPercent.toNumber()
      return {
        label: d.symbol,
        value,
        rewards: d.votes.rewards,
        logo: (
          <GroupIconTokens
            classNames={{
              image: 'outline-2 w-8 h-8',
              rows: '-space-x-2',
              toolTip: 'hidden',
            }}
            width={32}
            height={32}
            tokens={d.type === PAIR_TYPES.WEIGHTED ? d.tokens : [d.token0, d.token1]}
          />
        ),
        weightPercent: d.votes.weightPercent.toNumber(),
      }
    })

    return result || []
  }

  const pools = formatData()
  const timeData = [
    {
      value: untilNextEpoch,
    },
    {
      value: untilNextEpoch <= 120 ? 120 - untilNextEpoch : sinceLastEpoch,
    },
  ]

  // Generate background colors for pools
  const poolColors = pools.map((pool, i) => (pool?.label === 'Not voted' ? '#281B2E' : COLORS[i % COLORS.length]))

  // Generate background colors for time
  const timeColors = timeData.map((_, i) => (i === 0 ? '#580055' : untilNextEpoch <= 120 ? '#F51C00' : '#281B2E'))

  const chartData = {
    datasets: [
      ...[
        pools.length > 0
          ? {
              label: 'vote',
              data: pools.map(d => d.value),
              backgroundColor: poolColors,
              borderWidth: pools.length === 1 ? 0 : isMdDown ? 1 : 2,
              borderColor: '#1A121E',
              radius: '100%',
              cutout: isMdDown ? '87%' : '82%',
            }
          : {
              label: 'time',
              data: timeData.map(d => d.value),
              backgroundColor: timeColors,
              borderWidth: 0,
              radius: '100%',
              cutout: isMdDown ? '87%' : '82%',
            },
      ],
    ],
  }

  useEffect(() => {
    originalColors.current = [...poolColors]
  }, [data, poolColors, timeColors])

  const options = {
    cutout: '50%',
    rotation: -90,
    plugins: {
      tooltip: {
        enabled: false,
      },
      legend: {
        display: false,
      },
    },
    onHover: (_, elements) => {
      if (!chartRef.current || pools.length === 0) return

      const chart = chartRef.current

      if (elements.length > 0 && elements[0].datasetIndex === 0) {
        const hoveredPoolIndex = elements[0].index
        setHoveredIndex(hoveredPoolIndex)

        const newColors = originalColors.current.map((color, idx) => (idx === hoveredPoolIndex ? color : GRAY_COLOR))

        chart.data.datasets[0].backgroundColor = newColors
        chart.update('none')
      } else if (hoveredIndex !== null) {
        setHoveredIndex(null)
        chart.data.datasets[0].backgroundColor = originalColors.current
        chart.update('none')
      }
    },
    events: ['mousemove', 'mouseout'],
  }

  // Center content based on hover state
  const renderCenterContent = () => {
    const isHoveringValid = hoveredIndex !== null && pools[hoveredIndex]?.label !== 'Not voted'
    const pool = pools[hoveredIndex]

    return (
      <>
        <div className='mb-2 h-8'>{isHoveringValid && pool?.logo}</div>

        <div
          className={cn(
            'min-h-[36px] font-archia text-3xl font-semibold leading-9 text-primary-300',
            pools.length === 0 && 'text-xl uppercase leading-6 text-error-600',
          )}
        >
          {pools.length > 0
            ? isHoveringValid
              ? `$${formatAmount(pool?.rewards, true)}`
              : `$${formatAmount(expectedRewards, true)}`
            : 'NOT VOTED'}
        </div>

        <div className='flex min-h-[40px] flex-col text-sm text-neutral-500'>
          <span>{pools.length > 0 && 'Expected Rewards'}</span>
          <span>{pools.length > 0 && isHoveringValid ? `${formatAmount(pool?.weightPercent)}% vote power` : ''}</span>
        </div>
      </>
    )
  }

  return (
    <div className={cn('relative h-[224px] w-[224px]', className)}>
      <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-1 text-center'>
        {renderCenterContent()}
      </div>

      <div className='relative z-10'>
        <Doughnut data={chartData} options={options} ref={chartRef} />
      </div>
    </div>
  )
}

export default VotingChart
