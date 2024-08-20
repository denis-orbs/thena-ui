import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import Box from '@/components/box'

function TimeBox({ title, value }) {
  const t = useTranslations()
  return (
    <Box className='h-[68px] w-[69px] rounded-xl bg-neutral-700 p-2 md:h-[104px] md:w-[132px] md:p-6'>
      <p className='text-gradient-tertiary text-center font-archia text-xl font-semibold md:text-3xl'>{value}</p>
      <p className='text-center text-xs text-neutral-300 md:text-[16px]'>{t(title)}</p>
    </Box>
  )
}

export function CountDownNextChapter() {
  const targetDate = '2025-01-01T00:00:00.000Z'
  const calculateTimeLeft = useCallback(() => {
    const difference = moment(targetDate).diff(moment())
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    }

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    return timeLeft
  }, [targetDate])

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, calculateTimeLeft])

  return (
    <div className='mt-6 grid grid-cols-4 gap-4'>
      <TimeBox title='Days' value={timeLeft.days} />
      <TimeBox title='Hours' value={timeLeft.hours} />
      <TimeBox title='Minutes' value={timeLeft.minutes} />
      <TimeBox title='Seconds' value={timeLeft.seconds} />
    </div>
  )
}
