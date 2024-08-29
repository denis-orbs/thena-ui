import commonDayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/en'
import 'dayjs/locale/zh'

import { useLocaleSettings } from '@/state/settings/hooks'

export function useCommonDayJs() {
  const { locale } = useLocaleSettings()

  commonDayjs.extend(utc)
  commonDayjs.locale(locale)

  return commonDayjs
}
