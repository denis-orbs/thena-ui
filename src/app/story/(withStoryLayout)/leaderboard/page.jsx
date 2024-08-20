'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import HowItWorks from './HowItWorks'
import LeaderboardTable from './LeaderboardTable'

export default function LeaderboardPage() {
  const t = useTranslations()

  return (
    <div>
      <p className='text mt-2 text-[40px] font-semibold leading-9 text-neutral-50'>{t('Leaderboard')}</p>
      <p className='mb-6 text-neutral-300'>
        {`${t('Accumulate points through referrals, daily swap-ins, and task completion')} ${t(
          'Top 100 Thenians will receive all kind of rewards',
        )}`}
      </p>
      <LeaderboardTable />
      <HowItWorks />
    </div>
  )
}
