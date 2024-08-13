import { useTranslations } from 'next-intl'

import { ChapterProcess } from './ChapterProcess'

export function WeekProcess({ week }) {
  const t = useTranslations()
  return (
    <div className='rounded-xl bg-neutral-900 px-4 py-6'>
      <div id='week-process_heading'>
        <p className='text-center'>
          {`${week.taskComleted} / ${week.totalTasks} ${t('Tasks completed').toLowerCase()}`}
        </p>
        <div className='mt-2 h-3 w-full rounded-md bg-neutral-500'>
          <div
            style={{
              width: `${(week.taskComleted / week.totalTasks) * 100}%`,
            }}
            className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
          />
        </div>
        <hr className='my-6 border-neutral-600' />
        {week.chapters.map(chapter => (
          <ChapterProcess chapter={chapter} key={chapter.id} />
        ))}
      </div>
    </div>
  )
}
