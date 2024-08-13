import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

export function CountDownNextChapter() {
  const targetDate = moment(new Date()).add(3, 'days').toISOString()

  const t = useTranslations()
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
    <div className='mt-3 grid grid-cols-4 gap-4'>
      <div className='col-span-1 flex flex-col items-center rounded-lg bg-neutral-700 px-5 py-3'>
        <p className='text-xl font-bold text-fuchsia-500'>{timeLeft.days}</p>
        {t('Days')}
      </div>
      <div className='col-span-1 flex flex-col items-center rounded-lg bg-neutral-700 px-5 py-3'>
        <p className='text-xl font-bold text-fuchsia-500'>{timeLeft.hours}</p>
        {t('Hours')}
      </div>
      <div className='col-span-1 flex flex-col items-center rounded-lg bg-neutral-700 px-5 py-3'>
        <p className='text-xl font-bold text-fuchsia-500'>{timeLeft.minutes}</p>
        {t('Minutes')}
      </div>
      <div className='col-span-1 flex flex-col items-center rounded-lg bg-neutral-700 px-5 py-3'>
        <p className='text-xl font-bold text-fuchsia-500'>{timeLeft.seconds}</p>
        {t('Second')}
      </div>
    </div>
  )
}
