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
    if (nextChapter) {
      try {
        return isoDateToTimeStampSeconds(nextChapter.startTimestamp)
      } catch (error) {
        console.log(error)
      }
    }

    return 0
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

  return (
    <div className='mt-[63px]'>
      <TextHeading className='block font-archia text-3xl font-semibold leading-9'>{t('Weekly Tasks')}</TextHeading>
      <TextSubHeading className=' mt-2 block  max-w-[60%] text-base font-normal leading-5 text-gray-400'>
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
          {chapters[selectedChapterIndex - 1] && (
            <ChapterProcess
              chapter={chapters[selectedChapterIndex - 1]}
              preChapterIndex={preChapterIndex}
              nextChapterIndex={nextChapterIndex}
              setSelectedChapterIndex={setSelectedChapterIndex}
            />
          )}
        </div>
        <div className='col-span-12 lg:col-span-5'>
          {nextAvailableChapterTimeStamp && (
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
