import { useTranslations } from 'next-intl'

import { ArrowForwardSmallIcon, DiamondIcon, StarLineSmall } from '@/svgs'

export function ChapterProcess({ chapter }) {
  const t = useTranslations()
  return (
    <div className='border-purple rounded-xl border bg-neutral-900 px-4 py-6'>
      <div id='week-process_heading'>
        <p className='text-center text-[18px] font-medium leading-5'>
          {`0 / 6 ${t('Chapters completed').toLowerCase()}`}
        </p>
        <div className='4 mt4 mt-[][14px] inline-block h-3 w-full rounded-md bg-neutral-500'>
          <div
            style={{
              width: `${0 * 100}%`,
            }}
            className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
          />
        </div>
        <hr className='my-5  border-neutral-600' />
        <div>
          <p className='from-gradient-primary-start to-gradient-primary-end inline-block bg-gradient-to-r bg-clip-text text-base font-medium leading-5 tracking-[.03em] text-transparent'>
            {t('Chapter').toUpperCase()} {chapter.index}
          </p>
          <h3 className='text-3xl font-semibold'>{chapter.title}</h3>

          <div className='mt-1'>
            {chapter.tasks.map(task => (
              <div
                key={task.id}
                className='mt-3 flex flex-col items-center justify-between rounded-lg bg-neutral-800 p-3 px-4 py-5 lg:flex-row '
              >
                <div>
                  <p className='mb-2 text-xl font-medium leading-6'>{task.title}</p>
                </div>
                <div>
                  <div className='flex flex-row items-center'>
                    <span className='text-lg font-light leading-6 '>+{task.reward.amount}</span>
                    {task.reward.type === 'star' ? (
                      <StarLineSmall className='ml-1 inline-block h-6 w-6' />
                    ) : (
                      <DiamondIcon className='ml-1 inline-block h-6 w-6' />
                    )}
                    {task.completed ? (
                      <div className='ml-4 mt-2 w-[124px] rounded-lg bg-neutral-700 px-5 py-2 text-center leading-5 lg:mt-0 lg:px-4 lg:py-2.5 lg:text-base'>
                        {t('Completed')}
                      </div>
                    ) : (
                      <a href='./'>
                        <div className='ml-4 mt-2 w-[124px] rounded-lg bg-fuchsia-600 px-5 py-2 text-center leading-5 lg:mt-0 lg:px-4 lg:py-2.5 lg:text-base'>
                          {t('Start task')}
                          <ArrowForwardSmallIcon className='inline-block h-4 w-4' />
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
