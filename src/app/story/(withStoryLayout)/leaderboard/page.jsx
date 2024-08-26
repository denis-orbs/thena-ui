'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import HowItWorks from './HowItWorks'
import LeaderboardTable from './LeaderboardTable'

export default function LeaderboardPage() {
  const t = useTranslations()

  return (
    <>
      <div className='absolute left-0 top-[129px] h-[1077px] w-full bg-[url("/images/story/bg-leaderboard.png")] bg-cover' />
      <div className='relative'>
        <p className='text mb-2 text-[40px] font-semibold leading-9 text-neutral-50'>{t('Leaderboard')}</p>
        <p className='mb-6 text-neutral-300'>{t('Ascend the leaderboard by gathering')}</p>
        <LeaderboardTable />
        <HowItWorks />
      </div>
    </>
  )
}
