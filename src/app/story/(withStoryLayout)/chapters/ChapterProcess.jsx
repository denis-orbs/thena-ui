import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { getShareSocialNetworkUrl, SocialNetwork } from '@/lib/share-social'
import { cn } from '@/lib/utils'
import { ArrowBackwardIcon, ArrowForwardSmallIcon, ChevronRightIcon } from '@/svgs'

import { RewardIconTooltip } from './RewardIconTooltip'
import { TaskDailyName, TaskTwitterAction, TaskType } from '../../constant'

const TweetContent = `I’ve just joined THE Story with @ThenaFi_ 💜🏛️
First tasks completed, NFT fragment collected, and I’m on the path to over $30K in rewards!
Who’s with me? #StoryofTHENA`

export function ChapterProcess({
  chapter,
  setSelectedChapterIndex,
  preChapterIndex,
  nextChapterIndex,
  numberCompletedChapters,
  numberAvailableChapters,
}) {
  const t = useTranslations()
  const percentageTaskCompleted = useMemo(() => {
    if (numberAvailableChapters) {
      return (numberCompletedChapters / numberAvailableChapters) * 100
    }
    return 0
  }, [numberAvailableChapters, numberCompletedChapters])

  const getTaskHandleUrl = task => {
    if (task.type === TaskType.Main && task.actionHandle === TaskTwitterAction) {
      const url = getShareSocialNetworkUrl({
        network: SocialNetwork.Twitter,
        content: TweetContent,
      })
      return url
    }
    return `/${task.actionHandle}`
  }

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
            {`${t.rich('[numberCompletedChapters] / [numberAvailableChapters] chapters completed', {
              numberAvailableChapters,
              numberCompletedChapters,
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
        <hr className='my-5 border-neutral-600' />
        <div>
          <p className='text-gradient-primary inline-block text-base font-medium leading-5 tracking-[.03em]'>
            {t('Chapter').toUpperCase()} {chapter.index}
          </p>
          <h3 className='text-3xl font-semibold'>{chapter.available ? t(chapter.name) : t('The Fates Await')}</h3>

          {chapter.available && (
            <div className='mt-4 flex flex-col gap-3'>
              {chapter.tasks.map(task => (
                <div
                  key={task.id}
                  className='flex flex-col items-center gap-3 rounded-lg bg-neutral-800 px-4 py-3 lg:flex-row lg:py-4 xl:gap-4 xl:px-5'
                >
                  <div className='flex flex-1 items-center justify-between'>
                    <p className='text-lg font-medium'>{t(task.name)}</p>

                    <div>
                      {task.rewardAmount.map((amount, index) => (
                        <div key={index}>
                          {Boolean(amount) && task.name !== TaskDailyName && (
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

                  {task.isCompleted ? (
                    <EmphasisButton className='w-full lg:w-28' disabled>
                      {t('Completed')}
                    </EmphasisButton>
                  ) : (
                    <Link
                      href={getTaskHandleUrl(task)}
                      className='w-full lg:w-28'
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <PrimaryButton className='flex w-full items-center justify-center gap-1'>
                        <span>{t('Start task')}</span>
                        <ChevronRightIcon className='size-4' />
                      </PrimaryButton>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
