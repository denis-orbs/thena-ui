'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { useTHEStory } from '@/context/THEStoryContext'
import useWallet from '@/hooks/useWallet'
import { useFetchChaptersAndTasks } from '@/modules/Story'

import HowItWorks from './HowItWorks'
import { LeaderBoardChapterTabNavigator } from './LeaderBoardChapterTabNavigator'
import LeaderboardTable from './LeaderboardTable'

export default function LeaderboardPage() {
  const { account } = useWallet()
  const { campaignParticipantInfo: userInfo } = useTHEStory()
  const t = useTranslations()
  const { campaignChapters: chapters } = useFetchChaptersAndTasks(account?.toLowerCase())
  const [currentTabIndex, setCurrentTabIndex] = useState(1)

  const leaderBoardNav = useMemo(() => {
    const currentTime = new Date()
    const [start12, start3, start4, start5, start6, start7, start8] = [
      chapters?.[1]?.startTimestamp,
      chapters?.[2]?.startTimestamp,
      chapters?.[3]?.startTimestamp,
      chapters?.[4]?.startTimestamp,
      chapters?.[5]?.startTimestamp,
      chapters?.[6]?.startTimestamp,
      chapters?.[7]?.startTimestamp,
    ]
    return [
      {
        id: 1,
        index: 1,
        name: 'All Chapters',
        available: true,
      },
      {
        id: 2,
        index: 2,
        name: '1 and 2',
        available: start12 && currentTime > new Date(start12),
      },
      {
        id: 3,
        index: 3,
        name: '3',
        available: start3 && currentTime > new Date(start3),
      },
      {
        id: 4,
        index: 4,
        name: '4',
        available: start4 && currentTime > new Date(start4),
      },
      {
        id: 5,
        index: 5,
        name: '5',
        available: start5 && currentTime > new Date(start5),
      },
      {
        id: 6,
        index: 6,
        name: '6',
        available: start6 && currentTime > new Date(start6),
      },
      {
        id: 7,
        index: 7,
        name: '7',
        available: start7 && currentTime > new Date(start7),
      },
      {
        id: 8,
        index: 8,
        name: '8',
        available: start8 && currentTime > new Date(start8),
      },
    ]
  }, [chapters])

  if (!userInfo) {
    return <Loading />
  }

  return (
    <>
      <div className='absolute left-0 top-[129px] h-[1077px] w-full bg-[url("/images/story/bg-leaderboard.png")] bg-cover' />
      <div className='relative'>
        <p className='text mb-2 text-[40px] font-semibold leading-9 text-neutral-50'>{t('Leaderboard')}</p>
        <p className='mb-6 text-neutral-300'>{t('Ascend the leaderboard by gathering')}</p>
        <LeaderBoardChapterTabNavigator
          leaderBoardNav={leaderBoardNav}
          currentTabIndex={currentTabIndex}
          setCurrentTabIndex={setCurrentTabIndex}
        />
        <LeaderboardTable currentTabIndex={currentTabIndex} userInfo={userInfo} />
        <HowItWorks />
      </div>
    </>
  )
}
