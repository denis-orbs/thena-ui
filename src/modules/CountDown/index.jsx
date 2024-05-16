import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { Paragraph } from '@/components/typography'
import dayjs from '@/lib/arenaDayjs'

export function Countdown({ timestamp }) {
  const t = useTranslations()

  const [countDown, setCountDown] = useState(timestamp * 1000 - dayjs().unix() * 1000)

  const days = useMemo(() => Math.floor(countDown / (1000 * 60 * 60 * 24)), [countDown])
  const hours = useMemo(() => Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), [countDown])
  const minutes = useMemo(() => Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60)), [countDown])
  const seconds = useMemo(() => Math.floor((countDown % (1000 * 60)) / 1000), [countDown])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(timestamp * 1000 - dayjs().unix() * 1000)
    }, 1000)

    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <div className='flex justify-center space-x-4'>
      {days > 0 && (
        <Box className='flex h-24 flex-col items-center items-center justify-center bg-neutral-800 lg:p-4'>
          <Paragraph className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text bg-clip-text text-xl font-bold text-transparent xl:text-3xl'>
            {days}
          </Paragraph>
          <Paragraph className='text-xs xl:text-base'>{days <= 1 ? t('Day') : t('Days')}</Paragraph>
        </Box>
      )}

      {hours > 0 && (
        <Box className='flex h-24 flex-col items-center items-center justify-center bg-neutral-800 lg:p-4'>
          <Paragraph className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text bg-clip-text text-xl font-bold text-transparent xl:text-3xl'>
            {hours}
          </Paragraph>
          <Paragraph className='text-xs xl:text-base'>{hours <= 1 ? t('Hour') : t('Hours')}</Paragraph>
        </Box>
      )}
      {minutes > 0 && (
        <Box className='flex h-24 flex-col items-center items-center justify-center bg-neutral-800 lg:p-4'>
          <Paragraph className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text bg-clip-text text-xl font-bold text-transparent xl:text-3xl'>
            {minutes}
          </Paragraph>
          <Paragraph className='text-xs xl:text-base'>{minutes <= 1 ? t('Minute') : t('Minutes')}</Paragraph>
        </Box>
      )}

      {seconds >= 0 && (
        <Box className='flex h-24 flex-col items-center items-center justify-center bg-neutral-800 lg:p-4'>
          <Paragraph className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text bg-clip-text text-xl font-bold text-transparent xl:text-3xl'>
            {seconds}
          </Paragraph>
          <Paragraph className='text-xs xl:text-base'>{seconds <= 1 ? t('Second') : t('Seconds')}</Paragraph>
        </Box>
      )}
    </div>
  )
}
