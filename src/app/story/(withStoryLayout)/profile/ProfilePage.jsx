import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { useTHEStory } from '@/context/THEStoryContext'
import { fetchTHEStoryParticipantReferrals, useFetchChaptersAndTasks } from '@/modules/Story'

import { ChaptersOverview } from './ChaptersOverview'
import { DailySwap } from './DailySwap'
import { UserInfo } from './UserInfo'
import { WeeklyTasks } from './WeeklyTasks'

export function ProfilePage({ address }) {
  const {
    dailySwaps,
    userSwaps,
    campaignChapters: chapters,
    isLoading: isLoadingChapterTasks,
  } = useFetchChaptersAndTasks(address)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(1)

  useEffect(() => {
    if (chapters) {
      const lastCompletedChapters =
        [...chapters].sort((a, b) => b.index - a.index).find(item => item.isCompleted)?.index || 1
      const index = chapters.find(item => !item.isCompleted && item.available)?.index || lastCompletedChapters
      setSelectedChapterIndex(index)
    }
  }, [chapters])

  const { campaignParticipantInfo: userInfo } = useTHEStory()
  const { data: userReferral, isLoading: isLoadingReferral } = useSWR(
    ['campaignParticipantReferrals', address],
    () => fetchTHEStoryParticipantReferrals(address),
    {
      refreshInterval: 0,
    },
  )
  const totalSuccessfulReferral = useMemo(
    () => userReferral?.filter(referral => referral.isSuccess)?.length ?? 0,
    [userReferral],
  )

  const [numberCompletedChapters, numberAvailableChapters] = useMemo(
    () => [
      chapters.filter(chapter => chapter.available && chapter.isCompleted).length,
      chapters.filter(chapter => chapter.available).length,
    ],
    [chapters],
  )

  if (!address || !userInfo || isLoadingReferral || isLoadingChapterTasks) {
    return <Loading />
  }

  return (
    <div className='mt-10 space-y-10'>
      <UserInfo
        userInfo={userInfo}
        completedChapter={numberCompletedChapters}
        totalChapter={numberAvailableChapters}
        totalSuccessfulReferral={totalSuccessfulReferral}
      />
      {Boolean(numberAvailableChapters) && <DailySwap dailySwaps={dailySwaps} userSwaps={userSwaps} />}
      <WeeklyTasks
        chapters={chapters}
        selectedChapterIndex={selectedChapterIndex}
        setSelectedChapterIndex={setSelectedChapterIndex}
      />
      <ChaptersOverview chapters={chapters} />
    </div>
  )
}
