import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { TextHeading } from '@/components/typography'

import { ChapterOverviewProcess } from './ChapterOverviewProcess'

export function ChaptersOverview({ chapters }) {
  const t = useTranslations()

  const numberAvailableChapters = useMemo(() => chapters.filter(chapter => chapter.available).length, [chapters])

  if (!numberAvailableChapters) {
    return <></>
  }

  return (
    <div className='mt-[70px]'>
      <TextHeading className='font-archia block text-3xl leading-9 font-semibold'>
        {t('All Chapters Overview')}
      </TextHeading>
      <div className='mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-[30px] 2xl:grid-cols-4'>
        {chapters.map(chapter => chapter.available && <ChapterOverviewProcess chapter={chapter} key={chapter.id} />)}
      </div>
    </div>
  )
}
