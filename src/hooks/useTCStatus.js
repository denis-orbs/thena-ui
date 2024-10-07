import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { LOCALES } from '@/constant'
import { getTCStatus, TC_STATUS } from '@/lib/tradingCompetition/utils'
import { useLocaleSettings } from '@/state/settings/hooks'

export const useTCStatus = timestamp => {
  const t = useTranslations()
  const [TCStatus, setTCStatus] = useState()
  const [targetEventTime, setTargetEventTime] = useState('')
  const [percentCountDown, setPercentCountDown] = useState(0)
  const { locale } = useLocaleSettings()

  const formatCountDown = useCallback(
    target => {
      const now = dayjs()
      const targetTimeStamp = dayjs.tz(target * 1000)

      const inSeconds = Math.abs(now.diff(targetTimeStamp, 'second'))
      const inMinutes = Math.abs(now.diff(targetTimeStamp, 'minute'))
      const inHours = Math.abs(now.diff(targetTimeStamp, 'hour'))
      const inDays = Math.abs(now.diff(targetTimeStamp, 'day'))
      const inMonths = Math.abs(now.diff(targetTimeStamp, 'month'))
      const inYears = Math.abs(now.diff(targetTimeStamp, 'year'))

      if (inMonths >= 12) {
        return `${inYears} ${inYears === 1 ? t('Year') : t('Years')}`
      }

      if (inDays >= 30) {
        return `${inMonths} ${inMonths === 1 ? t('Month') : t('Months')}`
      }

      const textLocaleDays = locale === LOCALES.en ? 'd' : t('Days')
      const textLocaleHours = locale === LOCALES.en ? 'h' : t('Hours')
      const textLocaleMinutes = locale === LOCALES.en ? 'm' : t('Minutes')
      const textLocaleSeconds = locale === LOCALES.en ? 's' : t('Seconds')

      if (inMonths < 1) {
        let result = ''

        if (inDays) {
          result += `${inDays}${textLocaleDays} `
        }

        if (inHours && inHours - inDays * 24) {
          result += `${inHours - inDays * 24}${textLocaleHours} `
        }

        if (inMinutes && inMinutes - inHours * 60) {
          result += `${inMinutes - inHours * 60}${textLocaleMinutes} `
        }

        if (inSeconds) {
          result += `${inSeconds - inMinutes * 60}${textLocaleSeconds}`
        }

        return result
      }
    },
    [t, locale],
  )

  const _getTCStatus = useCallback(() => {
    const { registrationStart, registrationEnd, startTimestamp, endTimestamp } = timestamp

    const status = getTCStatus(timestamp)
    setTCStatus(status)

    const now = dayjs.unix()

    const format = locale === LOCALES.en ? 'MMM DD, YYYY hh:mm A' : 'YYYY年MM月DD号 HH点mm分'
    switch (status) {
      case TC_STATUS.WAIT_REGISTRATION:
        setTargetEventTime(dayjs.unix(registrationStart).format(format))
        setPercentCountDown(0)
        break
      case TC_STATUS.IN_REGISTRATION:
        setTargetEventTime(formatCountDown(registrationEnd))
        setPercentCountDown(Math.floor(((now - registrationStart) / (registrationEnd - registrationStart)) * 100))
        break
      case TC_STATUS.WAIT_START:
        setTargetEventTime(formatCountDown(startTimestamp))
        setPercentCountDown(Math.floor(((now - registrationEnd) / (startTimestamp - registrationEnd)) * 100))
        break
      case TC_STATUS.LIVE:
        setTargetEventTime(dayjs.unix(endTimestamp).format(format))
        setPercentCountDown(Math.floor(((now - startTimestamp) / (endTimestamp - startTimestamp)) * 100))
        break
      case TC_STATUS.ENDED:
        setTargetEventTime('')
        setPercentCountDown(100)
        break
      default:
    }
  }, [timestamp, formatCountDown, locale])

  const titleForTargetTime = useMemo(() => {
    switch (TCStatus) {
      case TC_STATUS.WAIT_REGISTRATION:
        return t('Registration Starts at')
      case TC_STATUS.IN_REGISTRATION:
        return t('Time left to join')
      case TC_STATUS.WAIT_START:
        return t('Competition Starts in')
      case TC_STATUS.LIVE:
        return t('Competition Ends at')
      case TC_STATUS.ENDED:
        return t('Competition Ended')
      default:
        return ''
    }
  }, [TCStatus, t])

  useEffect(() => {
    const interval = setInterval(() => _getTCStatus(), 1000)
    return () => clearInterval(interval)
  }, [_getTCStatus])

  return {
    TCStatus,
    targetEventTime,
    titleForTargetTime,
    percentCountDown,
  }
}
