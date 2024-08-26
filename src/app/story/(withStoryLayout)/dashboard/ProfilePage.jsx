import { useTranslations } from 'next-intl'
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
  const t = useTranslations()
  const { dailySwaps, campaignChapters: chapters, isLoading: isLoadingChapterTasks } = useFetchChaptersAndTasks(address)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0)

  useEffect(() => {
    if (chapters) {
      const index = chapters.findLast(chapter => chapter.available)?.index ?? 0
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

  const [completedChapter, totalChapter] = useMemo(
    () => [chapters?.filter(chapter => chapter.isCompleted)?.length, chapters?.length],
    [chapters],
  )

  const selectedDailySwap = useMemo(() => {
    const selectedChapter = chapters.find(chapter => chapter.index === selectedChapterIndex)
    return dailySwaps.filter(swap => swap?.chapter === selectedChapter?.index)
  }, [chapters, dailySwaps, selectedChapterIndex])

  if (!address || !userInfo || isLoadingReferral || isLoadingChapterTasks) {
    return <Loading />
  }

  return (
    <div className='mt-10 space-y-10'>
      <UserInfo
        userInfo={userInfo}
        completedChapter={completedChapter}
        totalChapter={totalChapter}
        totalSuccessfulReferral={totalSuccessfulReferral}
      />
      <DailySwap dailySwaps={selectedDailySwap} />
      <WeeklyTasks
        chapters={chapters}
        selectedChapterIndex={selectedChapterIndex}
        setSelectedChapterIndex={setSelectedChapterIndex}
      />
      <ChaptersOverview chapters={chapters} />
      <div className='mt-4 flex justify-center lg:mt-10'>
        <span className='font-archia text-3xl font-normal'>{t('More Coming')}</span>
      </div>
    </div>
  )
}
