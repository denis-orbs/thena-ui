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
    <div className='mt-6 grid grid-cols-4 gap-4'>
      <div className='col-span-1 flex flex-col items-center rounded-lg bg-neutral-700 px-6 py-6'>
        <p className='inline-block bg-gradient-to-r from-gradient-tertiary-start to-gradient-tertiary-end bg-clip-text text-3xl font-bold leading-6  text-transparent'>
          {timeLeft.days}
        </p>
        <span className='text-base leading-5 text-gray-400'>{t('Days')}</span>
      </div>
      <div className='col-span-1 flex flex-col items-center rounded-lg bg-neutral-700 px-6 py-6'>
        <p className='inline-block bg-gradient-to-r from-gradient-tertiary-start to-gradient-tertiary-end bg-clip-text text-3xl font-bold leading-6  text-transparent'>
          {timeLeft.hours}
        </p>
        <span className='text-base leading-5 text-gray-400'>{t('Hours')}</span>
      </div>
      <div className='col-span-1 flex flex-col items-center rounded-lg bg-neutral-700 px-6 py-6'>
        <p className='inline-block bg-gradient-to-r from-gradient-tertiary-start to-gradient-tertiary-end bg-clip-text text-3xl font-bold leading-6  text-transparent'>
          {timeLeft.minutes}
        </p>
        <span className='text-base leading-5 text-gray-400'>{t('Minutes')}</span>
      </div>
      <div className='col-span-1 flex flex-col items-center rounded-lg bg-neutral-700 px-6 py-6'>
        <p className='inline-block bg-gradient-to-r from-gradient-tertiary-start to-gradient-tertiary-end bg-clip-text text-3xl font-bold leading-6  text-transparent'>
          {timeLeft.seconds}
        </p>
        <span className='text-base leading-5 text-gray-400'>{t('Second')}</span>
      </div>
    </div>
  )
}
