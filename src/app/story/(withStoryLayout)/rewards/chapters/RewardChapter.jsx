import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

import { ChapterTabNavigator } from '@/modules/Story/ChapterTabNavigator'

import RewardChapterDetail from './RewardChapterDetail'
import RewardChapterFooter from './RewardChapterFooter'

export function RewardChapter({ chapters }) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(2)

  const rewardChapterNav = useMemo(() => {
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
        available: false,
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

  const currentChapter = useMemo(
    () => chapters.find(chapter => chapter.index === selectedChapterIndex),
    [chapters, selectedChapterIndex],
  )

  return (
    <div className='border-gradient-secondary w-full rounded-xl bg-neutral-900 p-px lg:col-span-6'>
      <div className='rounded-xl bg-neutral-900 p-4 lg:p-8'>
        <ChapterTabNavigator
          nav={rewardChapterNav}
          currentTabIndex={selectedChapterIndex}
          setCurrentTabIndex={setSelectedChapterIndex}
          classOfButton='lg:px-3! lg:py-2!'
        />
        <div>
          <RewardChapterDetail chapter={currentChapter} />
          {selectedChapterIndex === 1 ? (
            <RewardChapterFooter
              startTime={dayjs(chapters?.[0]?.startTimestamp ?? 0)}
              endTime={chapters?.[1]?.endTimestamp ? dayjs(chapters[1]?.endTimestamp).add(1, 'weeks') : dayjs(0)}
            />
          ) : (
            <RewardChapterFooter
              startTime={dayjs(currentChapter?.startTimestamp ?? 0)}
              endTime={currentChapter?.rewardsTimestamp ? dayjs(currentChapter?.rewardsTimestamp) : null}
              currentTabIndex={selectedChapterIndex}
            />
          )}
        </div>
      </div>
    </div>
  )
}
