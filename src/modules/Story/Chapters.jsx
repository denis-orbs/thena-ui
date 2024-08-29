import React, { useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { ChapterProcess } from '@/app/story/(withStoryLayout)/chapters/ChapterProcess'
import { ChapterTabNavigator } from '@/app/story/(withStoryLayout)/chapters/ChapterTabNavigator'

export default function Chapters({ chapters, isLoading }) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(1)

  useEffect(() => {
    if (chapters) {
      setSelectedChapterIndex([...chapters].reverse().findIndex(chapter => chapter.available) + 1)
    }
  }, [chapters])

  const preChapterIndex = useMemo(() => {
    const index = selectedChapterIndex - 1
    if (index < 1) return undefined
    return index
  }, [selectedChapterIndex])

  const nextChapterIndex = useMemo(() => {
    const index = selectedChapterIndex + 1
    if (index > chapters.length || !chapters[selectedChapterIndex]?.available) return undefined
    return index
  }, [chapters, selectedChapterIndex])

  const [numberCompletedChapters, numberAvailableChapters] = useMemo(
    () => [
      chapters.filter(chapter => chapter.isCompleted).length,
      chapters.filter(chapter => chapter.available).length,
    ],
    [chapters],
  )

  if (isLoading && !selectedChapterIndex) {
    return <Loading />
  }

  return (
    <>
      {chapters[selectedChapterIndex - 1] && (
        <>
          <div className='mb-5 mt-5 grid grid-cols-12 gap-8'>
            <div className='col-span-12'>
              <ChapterTabNavigator
                chapters={chapters}
                selectedChapterIndex={selectedChapterIndex}
                setSelectedChapterIndex={setSelectedChapterIndex}
              />
            </div>
          </div>
          <ChapterProcess
            chapter={chapters[selectedChapterIndex - 1]}
            preChapterIndex={preChapterIndex}
            nextChapterIndex={nextChapterIndex}
            setSelectedChapterIndex={setSelectedChapterIndex}
            numberCompletedChapters={numberCompletedChapters}
            numberAvailableChapters={numberAvailableChapters}
          />
        </>
      )}
    </>
  )
}
