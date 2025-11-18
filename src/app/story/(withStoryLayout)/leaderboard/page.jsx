'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { TextHeading, TextSubHeading } from '@/components/typography'
import useWallet from '@/hooks/useWallet'
import { useFetchChaptersAndTasks } from '@/modules/Story'
import { ChapterTabNavigator } from '@/modules/Story/ChapterTabNavigator'

import HowItWorks from './HowItWorks'
import LeaderboardTable from './LeaderboardTable'
import { useTHEStory } from '../../provider'

export default function LeaderboardPage() {
  const { account } = useWallet()
  const { campaignParticipantInfo: userInfo } = useTHEStory()
  const t = useTranslations()
  const { campaignChapters: chapters } = useFetchChaptersAndTasks(account?.toLowerCase())
  const [currentTabIndex, setCurrentTabIndex] = useState(1)

  const leaderBoardNav = useMemo(() => {
    const currentTime = new Date()
    const [start12, start3, start4, start5] = [
      chapters?.[1]?.startTimestamp,
      chapters?.[2]?.startTimestamp,
      chapters?.[3]?.startTimestamp,
      chapters?.[4]?.startTimestamp,
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
    ]
  }, [chapters])

  if (!userInfo) {
    return <Loading />
  }

  return (
    <>
      <div className='absolute top-[129px] left-0 h-[1077px] w-full bg-[url("/images/story/bg-leaderboard.png")] bg-cover' />
      <div className='relative'>
        <TextHeading className='font-archia block text-3xl font-semibold'>{t('Leaderboard')}</TextHeading>
        <TextSubHeading className='mt-2 block text-base text-neutral-300'>
          {t('Story Leaderboard Description')}
        </TextSubHeading>
        <div className='my-5'>
          <ChapterTabNavigator
            nav={leaderBoardNav}
            currentTabIndex={currentTabIndex}
            setCurrentTabIndex={setCurrentTabIndex}
          />
        </div>
        <LeaderboardTable
          currentTabIndex={currentTabIndex}
          userInfo={userInfo}
          rewardTimestamp={chapters[currentTabIndex - 1]?.rewardsTimestamp}
        />
        <HowItWorks />
      </div>
    </>
  )
}
