import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import dayjs from '@/lib/arenaDayjs'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'

export const useCountdown = (eventType, timeInput, onlyTime = false) => {
  const t = useTranslations()

  const [text, setText] = useState()

  useEffect(() => {
    const calculate = () => {
      if (!onlyTime && eventType === EVENT_TYPES.ENDED) {
        return t('Ended')
      }
      if (!onlyTime && eventType === EVENT_TYPES.LIVE) {
        return t('Started')
      }

      const now = dayjs()
      const timestamp = dayjs.tz(timeInput * 1000)

      const inSeconds = Math.abs(now.diff(timestamp, 'second'))
      const inMinutes = Math.abs(now.diff(timestamp, 'minute'))
      const inHours = Math.abs(now.diff(timestamp, 'hour'))
      const inDays = Math.abs(now.diff(timestamp, 'day'))
      const inMonths = Math.abs(now.diff(timestamp, 'month'))
      const inYears = Math.abs(now.diff(timestamp, 'year'))

      if (inMonths >= 12) {
        return `${inYears} ${inYears === 1 ? t('Year') : t('Years')}`
      }

      if (inDays >= 30) {
        return `${inMonths} ${inMonths === 1 ? t('Month') : t('Months')}`
      }

      if (inMonths < 1) {
        let result = ''

        if (inDays) {
          result += `${inDays}d:`
        }

        if (inHours && inHours - inDays * 24) {
          result += `${inHours - inDays * 24}h:`
        }

        if (inMinutes && inMinutes - inHours * 60) {
          result += `${inMinutes - inHours * 60}m:`
        }

        if (inSeconds) {
          result += `${inSeconds - inMinutes * 60}s`
        }

        return result
      }
    }
    const interval = setInterval(() => {
      setText(calculate())
    }, 1000)

    return () => clearInterval(interval)
  }, [eventType, t, timeInput, onlyTime])

  return {
    text,
  }
}
