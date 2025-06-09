import { useTranslations } from 'next-intl'
import PropTypes from 'prop-types'
import React, { useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { Paragraph } from '@/components/typography'

export function Countdown({ timestamp }) {
  const t = useTranslations()

  const [countDown, setCountDown] = useState(timestamp * 1000 - Date.now())

  const days = useMemo(() => Math.floor(countDown / (1000 * 60 * 60 * 24)), [countDown])
  const hours = useMemo(() => Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), [countDown])
  const minutes = useMemo(() => Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60)), [countDown])
  const seconds = useMemo(() => Math.floor((countDown % (1000 * 60)) / 1000), [countDown])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(timestamp * 1000 - Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <div className='flex justify-center gap-x-4'>
      {days > 0 && (
        <Box className='flex max-w-32 flex-1 flex-col items-center justify-center bg-neutral-700 px-2 py-2 lg:px-4 lg:py-4 2xl:px-6'>
          <Paragraph className='text-gradient-tertiary font-archia text-center text-xl font-semibold md:text-3xl'>
            {days}
          </Paragraph>
          <Paragraph className='text-xs xl:text-base'>{days <= 1 ? t('Day') : t('Days')}</Paragraph>
        </Box>
      )}

      {hours > 0 && (
        <Box className='flex max-w-32 flex-1 flex-col items-center justify-center bg-neutral-700 p-2 lg:p-4 2xl:p-6'>
          <Paragraph className='text-gradient-tertiary font-archia text-center text-xl font-semibold md:text-3xl'>
            {hours}
          </Paragraph>
          <Paragraph className='text-xs xl:text-base'>{hours <= 1 ? t('Hour') : t('Hours')}</Paragraph>
        </Box>
      )}

      {minutes > 0 && (
        <Box className='flex max-w-32 flex-1 flex-col items-center justify-center bg-neutral-700 p-2 lg:p-4 2xl:p-6'>
          <Paragraph className='text-gradient-tertiary font-archia text-center text-xl font-semibold md:text-3xl'>
            {minutes}
          </Paragraph>
          <Paragraph className='text-xs xl:text-base'>{minutes <= 1 ? t('Minute') : t('Minutes')}</Paragraph>
        </Box>
      )}

      {seconds >= 0 && (
        <Box className='flex max-w-32 flex-1 flex-col items-center justify-center bg-neutral-700 p-2 lg:p-4 2xl:p-6'>
          <Paragraph className='text-gradient-tertiary font-archia text-center text-xl font-semibold md:text-3xl'>
            {seconds}
          </Paragraph>
          <Paragraph className='text-xs xl:text-base'>{seconds <= 1 ? t('Second') : t('Seconds')}</Paragraph>
        </Box>
      )}
    </div>
  )
}

Countdown.propTypes = {
  /**
   * Unix timestamp in seconds representing the target time for the countdown. (10 digits)
   */
  timestamp: PropTypes.number.isRequired,
}
