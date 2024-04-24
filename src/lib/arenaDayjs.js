import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { getFromLocalStorage } from './helper'

dayjs.extend(utc)
dayjs.extend(timezone)

const timeZone = getFromLocalStorage('timezone') ?? undefined

dayjs.tz.setDefault(timeZone)

export default dayjs
