import { useTranslations } from 'next-intl'

import { Check2Icon } from '@/svgs'

export function ChapterOverviewProcess({ chapter }) {
  const t = useTranslations()
  return (
    <div className='min-h-80 rounded-xl border-[1px] border-purple bg-neutral-900 px-6 py-5'>
      <p className='text-center text-base font-medium leading-5'>1/3 {t('Tasks completed').toLowerCase()}</p>
      <div className='mt-2  inline-block h-2 w-full rounded-md bg-neutral-500'>
        <div
          style={{
            width: `${(1 / 3) * 100}%`,
          }}
          className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
        />
      </div>
      <hr className='my-4 border-neutral-600' />
      <div>
        <p className='text-base font-medium leading-5 tracking-[.03em] text-gradient '>
          {t('Chapter').toUpperCase()} {chapter.index}
        </p>
        <h3 className='mb-4 mt-1 text-3xl font-semibold'>{chapter.title}</h3>

        {chapter.tasks?.map(task => (
          <div className='mt-3 flex justify-between' key={task.id}>
            <span className='inline-block'>• {task.title}</span>
            <Check2Icon className='inline-block h-5 w-5' />
          </div>
        ))}
      </div>
    </div>
  )
}
