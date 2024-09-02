import { useEffect, useState } from 'react'

import { getEventType } from '@/lib/tradingCompetition/utils'

export const useEventType = timestamp => {
  const [eventType, setEventType] = useState()

  useEffect(() => {
    const interval = setInterval(() => setEventType(getEventType(timestamp)), 1000)
    return () => clearInterval(interval)
  }, [timestamp])

  return {
    eventType,
  }
}
