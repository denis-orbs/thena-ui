import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { ArrowBackwardIcon, ArrowForwardSmallIcon } from '@/svgs'

import { RewardIconTooltip } from './RewardIconTooltip'

export function ChapterProcess({ chapter }) {
  const t = useTranslations()
  const [totalTask, taskCompleted] = useMemo(
    () => [chapter?.tasks?.length ?? 0, chapter?.tasks?.filter(task => task.isCompleted)?.length ?? 0],
    [chapter],
  )
  const percentageTaskCompleted = useMemo(() => {
    if (totalTask) {
      return (taskCompleted / totalTask) * 100
    }
    return 0
  }, [totalTask, taskCompleted])

  console.log({ totalTask, taskCompleted, chapter })
  return (
    <div className='rounded-xl border-[1px] border-purple bg-neutral-900 px-4 py-6'>
      <div>
        <div className='flex items-center justify-between'>
          <Link className='text-gray-100 ' href='./'>
            <ArrowBackwardIcon className='inline-block h-5 w-5 opacity-40' />
            <span className='opacity-40'>{t('Back')}</span>
          </Link>
          <p className='text-center text-[18px] font-medium leading-5 text-gray-400'>
            {`${t('[taskCompleted] / [totalTask] Tasks completed', {
              totalTask,
              taskCompleted,
            })}`}
          </p>
          <Link className='text-gray-100' href='./'>
            {t('Next Chapter')}
            <ArrowForwardSmallIcon className='inline-block h-5 w-5' />
          </Link>
        </div>
        <div className='4 mt-6 inline-block h-3 w-full rounded-md bg-neutral-500'>
          <div
            style={{
              width: `${percentageTaskCompleted}%`,
            }}
            className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
          />
        </div>
        <hr className='my-5  border-neutral-600' />
        <div>
          <p className='text-gradient-primary inline-block text-base font-medium leading-5 tracking-[.03em]'>
            {t('Chapter').toUpperCase()} {chapter.index}
          </p>
          <h3 className='text-3xl font-semibold'>{t(chapter.name)}</h3>

          <div className='mt-1'>
            {chapter.tasks.map(task => (
              <div
                key={task.id}
                className='mt-3 flex flex-row items-center justify-between rounded-lg bg-neutral-800 p-3 px-4 py-5 lg:flex-row '
              >
                <div>
                  <p className='text-[18px] font-medium leading-6'>{t(task.name)}</p>
                </div>
                <div>
                  <div className='flex flex-row items-center'>
                    {task.rewardAmount.map((amount, index) => (
                      <div key={index} className='flex flex-row items-center'>
                        {!!amount && (
                          <>
                            <span className='text-lg font-light leading-6 '>+{amount}</span>
                            <RewardIconTooltip
                              rewardType={task.rewardType[index]}
                              id={`chapter-${chapter.id}_task-${task.id}_reward`}
                              iconSize={6}
                            />
                          </>
                        )}
                      </div>
                    ))}

                    <div className='ml-4  w-[124px] '>
                      {task.completed ? (
                        <EmphasisButton className='w-full' disabled>
                          {t('Completed')}
                        </EmphasisButton>
                      ) : (
                        <PrimaryButton className='w-full'>{t('Start task')}</PrimaryButton>
                      )}
                    </div>
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
