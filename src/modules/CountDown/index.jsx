import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { Paragraph } from '@/components/typography'

export function Countdown({ timestamp }) {
  const t = useTranslations()

  const [countDown, setCountDown] = useState(timestamp * 1000 - new Date().getTime())

  const days = useMemo(() => Math.floor(countDown / (1000 * 60 * 60 * 24)), [countDown])
  const hours = useMemo(() => Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), [countDown])
  const minutes = useMemo(() => Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60)), [countDown])
  const seconds = useMemo(() => Math.floor((countDown % (1000 * 60)) / 1000), [countDown])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(timestamp * 1000 - new Date().getTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <div className='grid grid-cols-4 gap-4'>
      <Box className='flex h-24 flex-col items-center items-center justify-center bg-neutral-800'>
        <Paragraph className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text bg-clip-text text-3xl font-bold text-transparent'>
          {days}
        </Paragraph>
        <Paragraph className='text-base'>{t('Days')}</Paragraph>
      </Box>
      <Box className='flex h-24 flex-col items-center items-center justify-center bg-neutral-800'>
        <Paragraph className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text bg-clip-text text-3xl font-bold text-transparent'>
          {hours}
        </Paragraph>
        <Paragraph className='text-base'>{t('Hours')}</Paragraph>
      </Box>
      <Box className='flex h-24 flex-col items-center items-center justify-center bg-neutral-800'>
        <Paragraph className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text bg-clip-text text-3xl font-bold text-transparent'>
          {minutes}
        </Paragraph>
        <Paragraph className='text-base'>{t('Minutes')}</Paragraph>
      </Box>
      <Box className='flex h-24 flex-col items-center items-center justify-center bg-neutral-800'>
        <Paragraph className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text bg-clip-text text-3xl font-bold text-transparent'>
          {seconds}
        </Paragraph>
        <Paragraph className='text-base'>{t('Seconds')}</Paragraph>
      </Box>
    </div>
  )
}
