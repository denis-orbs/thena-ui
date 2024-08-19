import React from 'react'

import Loading from '@/app/loading'
import { useUserInfo } from '@/context/campaignParticipantsContext'
import { useChapterTasks } from '@/context/chapterTasksContext'

import { ChaptersOverview } from './ChaptersOverview'
import { DailySwap } from './DailySwap'
import { UserInfo } from './UserInfo'
import { WeeklyTasks } from './WeeklyTasks'

export function ProfilePage({ address }) {
  const { campaignChapters, isLoading: isLoadingChapterTasks } = useChapterTasks()
  console.log({
    campaignChapters,
    isLoadingChapterTasks,
  })
  const {
    userInfo = {
      id: '0xb095069bdeb6be079206cb0a7cca2786d79cba7c',
      avatar: null,
      rank: 124,
      firstInteractAt: '2024-08-08',
    },
    isLoading: isLoadingUser,
  } = useUserInfo()

  console.log({ isLoadingUser })

  if (!address || !userInfo) {
    return <Loading />
  }

  return (
    <div className='mt-10 space-y-10'>
      <UserInfo userInfo={userInfo} />
      <DailySwap />
      <WeeklyTasks />
      <ChaptersOverview />
    </div>
  )
}
