import { useTranslations } from 'next-intl'

import { Check2Icon, Lock2Icon } from '@/svgs'

export function ChapterOverviewProcess({ chapter }) {
  const t = useTranslations()
  return (
    <div className='from-gradient-secondary-start to-gradient-secondary-end min-h-80 rounded-xl bg-gradient-to-b p-[1px]'>
      <div className='h-full rounded-[11px] bg-neutral-900 px-6 py-5'>
        <p className='text-center text-base font-medium leading-5 text-gray-400'>
          1/3 {t('Tasks completed').toLowerCase()}
        </p>
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
          <p className='from-gradient-primary-start to-gradient-primary-end inline-block bg-gradient-to-r bg-clip-text text-base font-medium leading-5 tracking-[.03em] text-transparent'>
            {t('Chapter').toUpperCase()} {chapter.index}
          </p>
          <div className='mb-4 mt-1 flex items-center '>
            <Lock2Icon className='mr-1 inline-block h-[30px] w-[30px]' />
            <h3 className='text-3xl font-semibold'>{chapter.title}</h3>
          </div>

          {chapter.tasks?.map(task => (
            <div className='mt-3 flex justify-between' key={task.id}>
              <span className='inline-block max-w-[calc(100%-20px)]'> • {task.title}</span>
              <Check2Icon className='inline-block h-5 w-5' />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
