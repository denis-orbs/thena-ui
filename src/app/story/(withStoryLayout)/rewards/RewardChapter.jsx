import { useMemo, useState } from 'react'

import { RewardChapter12 } from './RewardChapter12'
import { RewardChapterTabNavigator } from './RewardChapterTabNavigator'

export function RewardChapter({ chapters }) {
  const currentDate = useMemo(() => new Date(), [])
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(1)

  const [chapter1StartTime, chapter2EndTime] = useMemo(() => {
    const c1Start = new Date(chapters?.[0]?.startTimestamp ?? 0)
    const c2End = new Date(chapters?.[1]?.endTimestamp ?? 0)
    return [c1Start, c2End]
  }, [chapters])

  const chapterNavs = useMemo(
    () => [
      {
        id: 1,
        index: 1,
        name: 'Chapters 1 and 2',
        isCompleted: false,
        available: currentDate > chapter1StartTime,
      },
      {
        id: 2,
        index: 2,
        name: 'All Chapters',
        isCompleted: false,
        available: currentDate > chapter2EndTime,
      },
    ],
    [chapter1StartTime, currentDate, chapter2EndTime],
  )

  return (
    <div className='border-gradient-secondary w-full rounded-xl bg-neutral-900 p-[1px] lg:col-span-6 '>
      <div className='rounded-xl bg-neutral-900 p-4 lg:p-8'>
        <RewardChapterTabNavigator
          chapters={chapterNavs}
          selectedChapterIndex={selectedChapterIndex}
          setSelectedChapterIndex={setSelectedChapterIndex}
        />

        <div>{selectedChapterIndex === 1 && <RewardChapter12 chapters={chapters} />}</div>
        {/* TODO ALL CHAPTER  */}
      </div>
    </div>
  )
}
