'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import { TextHeading } from '@/components/typography'
import { Countdown } from '@/modules/CountDown'

export function TradeNotStarted({ startTimestamp, children }) {
  const t = useTranslations()

  return (
    <div className='relative h-full w-full'>
      <div className='absolute z-10 flex h-full w-full flex-col items-center justify-start gap-6 bg-[rgba(0,0,0,0.1)] pt-10 backdrop-blur-lg'>
        <TextHeading className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text text-3xl font-bold text-transparent blur-none'>
          {t('Trading Starts In')}
        </TextHeading>
        <Countdown timestamp={startTimestamp} />
      </div>
      <div className='w-full p-1'>{children}</div>
    </div>
  )
}
