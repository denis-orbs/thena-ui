import { useTranslations } from 'next-intl'

import { TextHeading } from '@/components/typography'

import { ChapterOverviewProcess } from './ChapterOverviewProcess'

export function ChaptersOverview({ chapters }) {
  const t = useTranslations()

  return (
    <div className='mt-[70px]'>
      <TextHeading className='block font-archia text-3xl font-semibold leading-9'>
        {t('All Chapters Overview')}
      </TextHeading>
      <div className='mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-[30px]'>
        {chapters.map(chapter => (
          <ChapterOverviewProcess chapter={chapter} key={chapter.id} />
        ))}
      </div>
    </div>
  )
}
