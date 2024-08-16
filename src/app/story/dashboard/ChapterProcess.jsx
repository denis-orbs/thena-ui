import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { ArrowBackwardIcon, ArrowForwardSmallIcon } from '@/svgs'

import { RewardIconTooltip } from './RewardIconTooltip'

export function ChapterProcess({ chapter }) {
  const t = useTranslations()
  return (
    <div className='rounded-xl border-[1px] border-purple bg-neutral-900 px-4 py-6'>
      <div>
        <div className='flex items-center justify-between'>
          <Link className='text-gray-100 ' href='./'>
            <ArrowBackwardIcon className='inline-block h-5 w-5 opacity-40' />
            <span className='opacity-40'>{t('Back')}</span>
          </Link>
          <p className='text-center text-[18px] font-medium leading-5 text-gray-400'>
            {`0 / 6 ${t('Chapters completed').toLowerCase()}`}
          </p>
          <Link className='text-gray-100' href='./'>
            {t('Next Chapter')}
            <ArrowForwardSmallIcon className='inline-block h-5 w-5' />
          </Link>
        </div>
        <div className='4 mt-6 inline-block h-3 w-full rounded-md bg-neutral-500'>
          <div
            style={{
              width: `${0 * 100}%`,
            }}
            className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
          />
        </div>
        <hr className='my-5  border-neutral-600' />
        <div>
          <p className='inline-block bg-gradient-to-r from-gradient-primary-start to-gradient-primary-end bg-clip-text text-base font-medium leading-5 tracking-[.03em] text-transparent'>
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
                    <RewardIconTooltip
                      rewardType={task.reward.type}
                      id={`chapter-${chapter.id}_task-${task.id}_reward`}
                      iconSize={6}
                    />
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
