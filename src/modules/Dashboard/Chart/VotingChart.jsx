import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'

import { cn, formatAmount } from '@/lib/utils'

const COLORS = ['#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F']

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
      }
    })

    if (!result || result.length === 0) {
      return [
        {
          label: 'Not voted',
          value: 1000,
        },
      ]
    }
    return result
  }

  const pools = formatData()
  const timeData = [
    {
      value: untilNextEpoch <= 120 ? 120 - untilNextEpoch : sinceLastEpoch,
    },
    {
      value: untilNextEpoch,
    },
  ]

  const chartData = {
    datasets: [
      {
        label: 'vote',
        data: pools.map(d => d.value),
        backgroundColor: pools.map((pool, i) => (pool.label === 'Not voted' ? '#281B2E' : COLORS[i % COLORS.length])),
        borderWidth: 0,
        spacing: pools.length === 1 && pools[0].label === 'Not voted' ? 0 : 2,
        radius: '72%',
        cutout: '62%',
      },
      {
        label: 'time',
        data: timeData.map(d => d.value),
        backgroundColor: timeData.map((_, i) =>
          i === 0 ? (untilNextEpoch <= 120 ? '#F51C00' : '#281B2E') : '#580055',
        ),
        borderWidth: 0,
        radius: '100%',
        cutout: '75%',
      },
    ],
  }

  const options = {
    cutout: '50%',
    plugins: {
      tooltip: {
        callbacks: {
          label(context) {
            const { dataIndex } = context
            const { datasetIndex } = context
            const val = formatAmount(context.raw)
            if (datasetIndex === 0) {
              return pools?.[dataIndex].label === 'Not voted' ? 'Not voted' : `${pools?.[dataIndex].label}: ${val}%`
            }
            return formatDuration(Number(context.raw))
          },
        },
      },
      legend: {
        display: false,
      },
    },
  }

  return (
    <div className={cn('relative h-[200px] w-[200px]', className)}>
      <div className='pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-1 text-center'>
        {pools.length === 1 && pools[0].label === 'Not voted' ? (
          <span className='font-bold uppercase text-error-600'>Not voted</span>
        ) : (
          <>
            <div className='text-3xl font-semibold text-primary-300'>${formatAmount(expectedRewards, true)}</div>
            <div className='text-sm text-neutral-500'>Expected Rewards</div>
          </>
        )}
      </div>

      <div className='relative z-10'>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  )
}

export default VotingChart
