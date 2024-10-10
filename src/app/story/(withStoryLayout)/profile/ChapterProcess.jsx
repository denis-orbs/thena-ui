'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TranslationWithFormatLink } from '@/components/common/TranslationWithFormatLink'
import { useTHEStory } from '@/context/THEStoryContext'
import { errorToast } from '@/lib/notify'
import { getShareSocialNetworkUrl, SocialNetwork } from '@/lib/share-social'
import { cn } from '@/lib/utils'
import { ArrowBackwardIcon, ArrowForwardSmallIcon, ChevronRightIcon } from '@/svgs'

import { RewardIconTooltip } from './RewardIconTooltip'
import {
  TaskDailyName,
  TaskDepositGamma,
  TaskDepositIchi,
  TaskTwitterAction,
  TaskTwitterRetweet,
  TaskType,
} from '../../constant'

const TweetContent = `I’ve just joined THE Story with @ThenaFi_ 💜🏛️

First tasks completed, NFT fragment collected, and I’m on the path to over $30K in rewards!

Who’s with me? #StoryofTHENA

https://thena.fi/story`

export function ChapterProcess({
  chapter,
  setSelectedChapterIndex,
  preChapterIndex,
  nextChapterIndex,
  numberCompletedChapters,
  numberAvailableChapters,
}) {
  const t = useTranslations()
  const { campaignParticipantInfo } = useTHEStory()

  const percentageTaskCompleted = useMemo(() => {
    if (numberAvailableChapters) {
      return (numberCompletedChapters / numberAvailableChapters) * 100
    }
    return 0
  }, [numberAvailableChapters, numberCompletedChapters])

  const handleTask = useCallback(
    task => {
      if (
        !campaignParticipantInfo.xProfileUsername &&
        ((task.type === TaskType.Main && task.actionHandle === TaskTwitterAction) ||
          task.actionHandle === TaskTwitterRetweet)
      ) {
        errorToast('You have to add your X account to Your Profile first', '', null, false, {
          style: {
            cursor: 'pointer',
          },
          autoClose: 10000,
          onClick: () => (window.location.href = '/story/edit-profile'),
        })
        return
      }
      if (task.type === TaskType.Main && task.actionHandle === TaskTwitterAction) {
        const url = getShareSocialNetworkUrl({
          network: SocialNetwork.Twitter,
          content: campaignParticipantInfo?.referralCode
            ? `${TweetContent}?ref=${campaignParticipantInfo.referralCode}`
            : TweetContent,
        })
        const width = window.screen.width / 2
        const height = window.screen.height / 2
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        window.open(url, '_blank', `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`)
        return
      }
      if (task.actionHandle === TaskTwitterRetweet) {
        window.open('https://x.com/ThenaFi_/status/1839273788736708771', '_blank')
      } else {
        window.location.href = `/${task.actionHandle}`
      }
    },
    [campaignParticipantInfo.referralCode, campaignParticipantInfo.xProfileUsername],
  )

  const renderTaskName = useCallback(
    task => {
      if (task.name === TaskDepositIchi) {
        return (
          <TranslationWithFormatLink
            text={t(task.name)}
            className='text-lg font-medium'
            hyperLinks={[
              {
                text: 'BNB-THE',
                link: 'https://thena.fi/pools/0x51bd5e6d3da9064d59bcaa5a76776560ab42ceb8',
              },
              {
                text: 'USDT-THE',
                link: 'https://thena.fi/pools/0x98a0004b8e9fe161369528a2e07de56c15a27d76',
              },
              {
                text: 'ETH-THE',
                link: 'https://thena.fi/pools/0x752328a1e16d38933789860b8c09f6f2cc6c63d6',
              },
              {
                text: 'USDC-THE',
                link: 'https://thena.fi/pools/0x7c0b5d39765b221810d477e8f02d47a9badf018a',
              },
              {
                text: 'BTC-THE',
                link: 'https://thena.fi/pools/0x246505db95e5a60d8524d52b9ed3dbaf6ee2584f',
              },
            ]}
          />
        )
      }

      if (task.name === TaskDepositGamma) {
        return (
          <TranslationWithFormatLink
            text={t(task.name)}
            className='text-lg font-medium'
            translate
            hyperLinks={[
              {
                text: 'ETH-BNB',
                link: 'https://thena.fi/pools/0x1123e75b71019962cd4d21b0f3018a6412edb63c',
              },
              {
                text: 'USDT-BNB',
                link: 'https://thena.fi/pools/0xd405b976ac01023c9064024880999fc450a8668b',
              },
            ]}
          />
        )
      }

      return <p className='text-lg font-medium'>{t(task.name)}</p>
    },
    [t],
  )

  return (
    <div className='rounded-xl border border-primary-600 bg-neutral-900 px-4 py-6'>
      <div>
        <div className='flex flex-wrap items-center justify-between lg:flex-nowrap'>
          <div
            className={cn('order-1 w-1/2 cursor-pointer text-gray-100 lg:w-auto', preChapterIndex ? '' : 'opacity-40')}
            onClick={() => preChapterIndex && setSelectedChapterIndex(preChapterIndex)}
          >
            <ArrowBackwardIcon className='inline-block h-5 w-5' />
            <span>{t('Back')}</span>
          </div>
          <p className='order-3 mt-3 w-full text-center text-[18px] font-medium leading-5 text-neutral-300 lg:order-2 lg:mt-0 lg:w-auto'>
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
                  <div className='flex w-full flex-1 items-center justify-between'>
                    {renderTaskName(task)}

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
                    <PrimaryButton
                      className='flex w-full  items-center justify-center gap-1 lg:w-28'
                      onClick={() => handleTask(task)}
                    >
                      <span>{t('Start task')}</span>
                      <ChevronRightIcon className='size-4' />
                    </PrimaryButton>
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
