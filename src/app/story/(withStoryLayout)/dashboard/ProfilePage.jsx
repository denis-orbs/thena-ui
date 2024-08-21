import React, { useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { useTHEStory } from '@/context/THEStoryContext'
import { useFetchChaptersAndTasks } from '@/hooks/useChapterAndTasks'
import { fetchTHEStoryParticipantReferrals } from '@/modules/Story'

import { ChaptersOverview } from './ChaptersOverview'
import { DailySwap } from './DailySwap'
import { UserInfo } from './UserInfo'
import { WeeklyTasks } from './WeeklyTasks'

export function ProfilePage({ address }) {
  const { dailySwaps, campaignChapters, isLoading: isLoadingChapterTasks } = useFetchChaptersAndTasks(address)

  const { campaignParticipantInfo: userInfo } = useTHEStory()

  const { data: userRefferal, isLoading: isLoadingReferral } = useSWR(
    ['campaignParticipantReferrals', address],
    () => fetchTHEStoryParticipantReferrals(address),
    {
      refreshInterval: 0,
    },
  )
  const totalSuccessfulRefferal = useMemo(
    () => userRefferal?.filter(referral => referral.isSuccess)?.length ?? 0,
    [userRefferal],
  )

  const [completedChapter, totalChapter] = useMemo(
    () => [campaignChapters?.filter(chapter => chapter.isCompleted)?.length, campaignChapters?.length],
    [campaignChapters],
  )
  if (!address || !userInfo || isLoadingReferral || isLoadingChapterTasks) {
    return <Loading />
  }

  return (
    <div className='mt-10 space-y-10'>
      <UserInfo
        userInfo={userInfo}
        completedChapter={completedChapter}
        totalChapter={totalChapter}
        totalSuccessfulRefferal={totalSuccessfulRefferal}
      />
      <DailySwap dailySwaps={dailySwaps} />
      <WeeklyTasks chapters={campaignChapters} />
      <ChaptersOverview chapters={campaignChapters} />
    </div>
  )
}
