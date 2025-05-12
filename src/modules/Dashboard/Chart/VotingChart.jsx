import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'

import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import { PAIR_TYPES } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'

const COLORS = ['#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F']
const GRAY_COLOR = '#281B2E'

function formatDuration(seconds) {
  const days = Math.floor(seconds / (3600 * 24))
  const hours = Math.floor((seconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (secs || parts.length === 0) parts.push(`${secs}s`)

  return parts.join('')
}

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
              image: 'outline-2 w-7 h-7',
              rows: '-space-x-2',
              toolTip: 'hidden',
            }}
            width={28}
            height={28}
            tokens={d.type === PAIR_TYPES.WEIGHTED ? d.tokens : [d.token0, d.token1]}
          />
        ),
        weightPercent: d.votes.weightPercent.toNumber(),
      }
    })

    if (!result || result.length === 0) {
      return [
        {
          label: 'Not voted',
          value: 1000,
          rewards: new BigNumber(0),
          weightPercent: new BigNumber(100),
        },
      ]
    }
    return result
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
  const poolColors = pools.map((pool, i) => (pool.label === 'Not voted' ? '#281B2E' : COLORS[i % COLORS.length]))

  // Generate background colors for time
  const timeColors = timeData.map((_, i) => (i === 0 ? '#580055' : untilNextEpoch <= 120 ? '#F51C00' : '#281B2E'))

  const chartData = {
    datasets: [
      {
        label: 'vote',
        data: pools.map(d => d.value),
        backgroundColor: poolColors,
        borderWidth: 0,
        spacing: pools.length === 1 && pools[0].label === 'Not voted' ? 0 : 2,
        radius: '72%',
        cutout: '62%',
      },
      {
        label: 'time',
        data: timeData.map(d => d.value),
        backgroundColor: timeColors,
        borderWidth: 0,
        radius: '100%',
        cutout: '75%',
      },
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
        filter: tooltipItem => tooltipItem.datasetIndex === 1,
        callbacks: {
          label(context) {
            return formatDuration(Number(context.raw))
          },
        },
      },
      legend: {
        display: false,
      },
    },
    onHover: (_, elements) => {
      if (!chartRef.current) return

      const chart = chartRef.current

      if (elements.length > 0 && elements[0].datasetIndex === 0) {
        const hoveredPoolIndex = elements[0].index
        setHoveredIndex(hoveredPoolIndex)

        // only for voting dataset
        const newColors = originalColors.current.map((color, idx) => (idx === hoveredPoolIndex ? color : GRAY_COLOR))
        chart.data.datasets[0].backgroundColor = newColors

        chart.update('none')
      } else if (hoveredIndex !== null) {
        // Reset colors when not hovering
        setHoveredIndex(null)
        chart.data.datasets[0].backgroundColor = originalColors.current
        chart.update('none')
      }
    },
    events: ['mousemove', 'mouseout'],
  }

  // Center content based on hover state
  const renderCenterContent = () => {
    if (pools.length === 1 && pools[0].label === 'Not voted') {
      return <span className='font-bold uppercase text-error-600'>Not voted</span>
    }

    if (hoveredIndex !== null && pools[hoveredIndex]?.label !== 'Not voted') {
      const pool = pools[hoveredIndex]
      return (
        <>
          {pool.logo}
          <div className='text-2xl font-semibold text-primary-300'>${formatAmount(pool.rewards, true)}</div>
          <div className='text-sm text-neutral-500'>{formatAmount(pool.weightPercent)}% vote power</div>
        </>
      )
    }

    return (
      <>
        <div className='text-3xl font-semibold text-primary-300'>${formatAmount(expectedRewards, true)}</div>
        <div className='text-sm text-neutral-500'>Expected Rewards</div>
      </>
    )
  }

  return (
    <div className={cn('relative h-[200px] w-[200px]', className)}>
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
