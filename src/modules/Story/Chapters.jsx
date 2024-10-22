import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { ChapterProcess } from '@/app/story/(withStoryLayout)/profile/ChapterProcess'
import { ChapterTabNavigator } from '@/app/story/(withStoryLayout)/profile/ChapterTabNavigator'

export default function Chapters({ chapters, isLoading }) {
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
        [...chapters].sort((a, b) => b.index - a.index).find(item => item?.isCompleted)?.index || 1
      const index = chapters.find(item => !item.isCompleted && item.available)?.index || lastCompletedChapters
      const lastChapterAvailable = [...chapters].reverse().find(item => item?.available)
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
      chapters.filter(chapter => chapter.available && chapter.isCompleted).length,
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
