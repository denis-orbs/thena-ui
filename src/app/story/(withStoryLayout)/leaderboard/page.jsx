'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import Loading from '@/app/loading'
import { useTHEStory } from '@/context/THEStoryContext'

import HowItWorks from './HowItWorks'
import LeaderboardTable from './LeaderboardTable'

export default function LeaderboardPage() {
  const { campaignParticipantInfo: userInfo } = useTHEStory()
  const t = useTranslations()

  if (!userInfo) {
    return <Loading />
  }

  return (
    <>
      <div className='absolute left-0 top-[129px] h-[1077px] w-full bg-[url("/images/story/bg-leaderboard.png")] bg-cover' />
      <div className='relative'>
        <p className='text mb-2 text-[40px] font-semibold leading-9 text-neutral-50'>{t('Leaderboard')}</p>
        <p className='mb-6 text-neutral-300'>{t('Ascend the leaderboard by gathering')}</p>
        <LeaderboardTable userInfo={userInfo} />
        <HowItWorks />
      </div>
    </>
  )
}
