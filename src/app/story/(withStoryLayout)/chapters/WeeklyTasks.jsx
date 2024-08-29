import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { TextHeading, TextSubHeading } from '@/components/typography'
import { isoDateToTimeStampSeconds } from '@/lib/utils'
import { Countdown } from '@/modules/Countdown'

import { ChapterProcess } from './ChapterProcess'
import { ChapterTabNavigator } from './ChapterTabNavigator'

export function WeeklyTasks({ chapters, selectedChapterIndex, setSelectedChapterIndex }) {
  const t = useTranslations()

  const nextAvailableChapterTimeStamp = useMemo(() => {
    const nextChapter = chapters.find(chapter => !chapter.available)
    const lastAvailableChapter = chapters.findLast(chapter => chapter.available)
    if (nextChapter) {
      try {
        return isoDateToTimeStampSeconds(nextChapter.startTimestamp)
      } catch (error) {
        console.log(error)
      }
    } else if (lastAvailableChapter) {
      try {
        return isoDateToTimeStampSeconds(lastAvailableChapter.endTimestamp)
      } catch (error) {
        console.log(error)
      }
    }
    return 0
  }, [chapters])

  const currentChapter = useMemo(
    () => chapters.find(c => c.index === selectedChapterIndex),
    [chapters, selectedChapterIndex],
  )

  const preChapterIndex = useMemo(() => {
    const index = selectedChapterIndex - 1
    const chapter = chapters.find(c => c.index === index)

    if (chapter) return index
    return undefined
  }, [selectedChapterIndex, chapters])

  const nextChapterIndex = useMemo(() => {
    const index = selectedChapterIndex + 1
    const chapter = chapters.find(c => c.index === index)

    if (chapter?.available) return index
    return undefined
  }, [chapters, selectedChapterIndex])

  const [numberCompletedChapters, numberAvailableChapters] = useMemo(
    () => [
      chapters.filter(chapter => chapter.isCompleted).length,
      chapters.filter(chapter => chapter.available).length,
    ],
    [chapters],
  )

  return (
    <div className='mt-[63px]'>
      <TextHeading className='block font-archia text-3xl font-semibold leading-9'>{t('Weekly Tasks')}</TextHeading>
      <TextSubHeading className=' mt-2 block  text-base font-normal leading-5 text-gray-400 lg:max-w-[60%]'>
        {t('Weekly task description')}
      </TextSubHeading>
      <div className='mt-5 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          <ChapterTabNavigator
            chapters={chapters}
            selectedChapterIndex={selectedChapterIndex}
            setSelectedChapterIndex={setSelectedChapterIndex}
          />
        </div>
      </div>
      <div className='mt-6 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          {currentChapter && (
            <ChapterProcess
              chapter={currentChapter}
              preChapterIndex={preChapterIndex}
              nextChapterIndex={nextChapterIndex}
              setSelectedChapterIndex={setSelectedChapterIndex}
              numberCompletedChapters={numberCompletedChapters}
              numberAvailableChapters={numberAvailableChapters}
            />
          )}
        </div>
        <div className='col-span-12 lg:col-span-5'>
          {Boolean(nextAvailableChapterTimeStamp) && (
            <div className='rounded-lg bg-neutral-900 px-6 py-6'>
              <h2 className='mb-6 font-archia'>{t('Next Chapter Available in')}</h2>
              <Countdown timestamp={nextAvailableChapterTimeStamp} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
