import PropTypes from 'prop-types'
import { useEffect, useMemo, useState } from 'react'

export function CountDownAnnouncement({ timestamp }) {
  const [countDown, setCountDown] = useState(timestamp * 1000 - Date.now())

  const days = useMemo(() => Math.floor(countDown / (1000 * 60 * 60 * 24)), [countDown])
  const hours = useMemo(() => Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), [countDown])
  const minutes = useMemo(() => Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60)), [countDown])
  // const seconds = useMemo(() => Math.floor((countDown % (1000 * 60)) / 1000), [countDown])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(timestamp * 1000 - Date.now())
    }, 1000 * 60)

    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <>
      {days > 0 && <span>{days}d </span>}
      {hours > 0 && <span>{hours}h </span>}
      {minutes > 0 && <span>{minutes}m </span>}
    </>
  )
}

CountDownAnnouncement.propTypes = {
  /**
   * Unix timestamp in seconds representing the target time for the countdown. (10 digits)
   */
  timestamp: PropTypes.number.isRequired,
}
