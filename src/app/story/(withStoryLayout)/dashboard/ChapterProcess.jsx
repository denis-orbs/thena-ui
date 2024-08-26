import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { cn } from '@/lib/utils'
import { ArrowBackwardIcon, ArrowForwardSmallIcon } from '@/svgs'

import { RewardIconTooltip } from './RewardIconTooltip'

export function ChapterProcess({ chapter, setSelectedChapterIndex, preChapterIndex, nextChapterIndex }) {
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

  return (
    <div className='rounded-xl border-[1px] border-primary-600 bg-neutral-900 px-4 py-6'>
      <div>
        <div className='flex flex-wrap items-center justify-between lg:flex-nowrap'>
          <div
            className={cn('order-1 w-1/2 cursor-pointer text-gray-100 lg:w-auto', preChapterIndex ? '' : 'opacity-40')}
            onClick={() => preChapterIndex && setSelectedChapterIndex(preChapterIndex)}
          >
            <ArrowBackwardIcon className='inline-block h-5 w-5' />
            <span>{t('Back')}</span>
          </div>
          <p className='order-3 mt-3 w-full text-center text-[18px] font-medium leading-5 text-gray-400 lg:order-2 lg:mt-0 lg:w-auto'>
            {`${t('[taskCompleted] / [totalTask] Tasks completed', {
              totalTask,
              taskCompleted,
            })}`}
          </p>
          <div
            className={cn(
              ' order-2 flex w-1/2 cursor-pointer justify-end  text-gray-100 lg:order-3 lg:w-auto',
              nextChapterIndex ? '' : 'opacity-40',
            )}
            onClick={() => nextChapterIndex && setSelectedChapterIndex(nextChapterIndex)}
          >
            <span>{t('Next Chapter')}</span>
            <ArrowForwardSmallIcon className='inline-block h-5 w-5' />
          </div>
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
                className='mt-3 grid grid-cols-12 gap-4 rounded-lg bg-neutral-800 p-3 px-4 py-5 lg:flex-row'
              >
                <div className='col-span-12 flex items-center justify-between lg:col-span-10'>
                  <div>
                    <p className='text-[18px] font-medium leading-6'>{t(task.name)}</p>
                  </div>

                  <div>
                    {task.rewardAmount.map((amount, index) => (
                      <div key={index}>
                        {!!amount && (
                          <div className='flex flex-row items-center'>
                            <span className='text-lg font-light leading-6 '>+{amount}</span>
                            <RewardIconTooltip
                              rewardType={task.rewardType[index]}
                              id={`chapter-${chapter.id}_task-${task.id}_reward`}
                              iconSize={6}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className='col-span-12 flex flex-row items-center lg:col-span-2'>
                  <div className='w-full '>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
