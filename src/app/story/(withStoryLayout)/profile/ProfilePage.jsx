import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { fetchTHEStoryParticipantReferrals, useFetchChaptersAndTasks } from '@/modules/Story'

import { ChaptersOverview } from './ChaptersOverview'
import { DailySwap } from './DailySwap'
import { UserInfo } from './UserInfo'
import { WeeklyTasks } from './WeeklyTasks'
import { useTHEStory } from '../../provider'

export function ProfilePage({ address }) {
  const {
    dailySwaps,
    userSwaps,
    campaignChapters: chapters,
    isLoading: isLoadingChapterTasks,
  } = useFetchChaptersAndTasks(address)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(1)

  const chapterHasEnded = useCallback(chapter => {
    const currentTime = new Date()
    const endTime = new Date(chapter?.endTimestamp)

    return endTime <= currentTime
  }, [])

  const allChaptersCompleted = useCallback(
    (data, lastIdx) => data.slice(0, lastIdx).every(item => item?.isCompleted === true),
    [],
  )
  useEffect(() => {
    if (chapters) {
      const lastCompletedChapters =
        [...chapters].sort((a, b) => b.index - a.index).find(item => item.isCompleted)?.index || 1
      const index = chapters.find(item => !item.isCompleted && item.available)?.index || lastCompletedChapters
      const lastChapterAvailable = [...chapters].reverse().find(item => item.available)
      if (!chapterHasEnded(lastChapterAvailable) && !lastChapterAvailable?.isCompleted) {
        setSelectedChapterIndex(lastChapterAvailable?.index)
      } else {
        const isAllChaptersCompleted = allChaptersCompleted(chapters, lastChapterAvailable?.index)
        if (isAllChaptersCompleted && chapterHasEnded(lastChapterAvailable)) {
          setSelectedChapterIndex(1)
        } else {
          setSelectedChapterIndex(index)
        }
      }
    }
  }, [allChaptersCompleted, chapterHasEnded, chapters])

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
    <div className='mt-10 flex flex-col gap-10'>
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
