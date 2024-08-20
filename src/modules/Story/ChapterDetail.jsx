import { useTranslations } from 'next-intl'
import React from 'react'

import { ChapterProcess } from '@/app/story/(withStoryLayout)/dashboard/ChapterProcess'
import { CountDownNextChapter } from '@/app/story/(withStoryLayout)/dashboard/CountDownNextChapter'

function ChapterDetail(selectedChapter) {
  const t = useTranslations()
  return (
    <div className='mt-5 grid grid-cols-12 gap-8 lg:gap-12'>
      <div className='col-span-12 lg:col-span-7'>
        <ChapterProcess chapter={selectedChapter} />
      </div>
      <div className='col-span-12 lg:col-span-5'>
        <div className='rounded-lg bg-neutral-900 px-6 py-6'>
          <h2 className='font-archia'>{t('Next Chapter Available in')}</h2>
          <p className='text-lg font-normal leading-5'>{t('Next Chapter description')}</p>
          <CountDownNextChapter />
        </div>
      </div>
    </div>
  )
}

export default ChapterDetail
