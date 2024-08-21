import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { TextHeading, TextSubHeading } from '@/components/typography'

import { ChapterProcess } from './ChapterProcess'
import { ChapterTabNavigator } from './ChapterTabNavigator'
import { CountDownNextChapter } from './CountDownNextChapter'

export function WeeklyTasks({ chapters }) {
  const t = useTranslations()
  const [selectedChapter, setSelectedChapter] = useState(chapters[0])
  const nextChapterTimeStamp = useMemo(
    () => chapters.find(chapter => !chapter.available)?.startTimestamp ?? '',
    [chapters],
  )

  return (
    <div className='mt-[63px]'>
      <TextHeading className='block font-archia text-3xl font-semibold leading-9'>{t('Weekly Tasks')}</TextHeading>
      <TextSubHeading className='mt-2  block text-base font-normal leading-5 text-gray-400'>
        {t('Weekly task description')}
      </TextSubHeading>
      <div className='mt-5 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          <ChapterTabNavigator
            chapters={chapters}
            selectedChapter={selectedChapter}
            setSelectedChapter={setSelectedChapter}
          />
        </div>
      </div>
      <div className='mt-5 grid grid-cols-12 gap-8 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          {selectedChapter && <ChapterProcess chapter={selectedChapter} />}
        </div>
        <div className='col-span-12 lg:col-span-5'>
          {nextChapterTimeStamp && (
            <div className='rounded-lg bg-neutral-900 px-6 py-6'>
              <h2 className='font-archia'>{t('Next Chapter Available in')}</h2>
              <p className='text-lg font-normal leading-5'>{t('Next Chapter description')}</p>
              <CountDownNextChapter targetDate={nextChapterTimeStamp} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
