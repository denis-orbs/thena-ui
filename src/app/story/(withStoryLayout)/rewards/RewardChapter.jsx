import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { cn, isoDateToTimeStampSeconds } from '@/lib/utils'
import { HowItWorksItem } from '@/modules/Story/HowItWorksItem'
import { AlertCirlceSmallIcon, BankIcon, FingerprintIcon, RoundedTHETokenIcon, THETokenIcon } from '@/svgs'

import { CountDownAnnouncement } from './CountDownAnnouncement'
import { RewardChapterTabNavigator } from './RewardChapterTabNavigator'

// FIXME remove mock data
const storyReward = {
  // isChecked: true,
  isChecked: false,
  // rewards: null,
  rewards: {
    amount: 100,
    type: 'THE Tokens',
    isClaimed: false,
    // isClaim: true,
  },
}

// FIXME remove mock data
const rewards = [
  {
    id: '1',
    index: 1,
    name: 'THE Tokens',
    description: 'Tokens will be distributed among 100 winners.',
    icon: THETokenIcon,
  },
  {
    id: '2',
    index: 2,
    name: '2 theNFTs',
    description: 'You can stake theNFT to earn THE tokens.',
    icon: BankIcon,
  },
  {
    id: '3',
    index: 3,
    name: '1 THENA ID',
    description: 'Use Thena ID to customise your THENA profile.',
    icon: FingerprintIcon,
  },
]

export function RewardChapter({ chapters }) {
  const t = useTranslations()
  const currentDate = useMemo(() => new Date(), [])
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(1)

  const [chapter1StartTime, chapterProgressPercent, targetCountdown] = useMemo(() => {
    const c1Start = new Date(chapters?.[0]?.startTimestamp ?? 0)
    const c2End = new Date(chapters?.[1]?.endTimestamp ?? 0)

    const lastEndtime = new Date([...chapters]?.reverse().find(() => true)?.endTimestamp ?? 0)

    let progressPercent = 0
    if (currentDate > c1Start && currentDate < lastEndtime) {
      progressPercent = ((currentDate - c1Start) * 100) / (lastEndtime - c1Start)
    } else if (currentDate >= lastEndtime) {
      progressPercent = 100
    }

    let countDown = c1Start
    if (currentDate > c1Start && currentDate < c2End) {
      countDown = c2End
    } else if (currentDate >= c2End) {
      countDown = lastEndtime
    } else if (currentDate > lastEndtime) {
      countDown = undefined
    }

    return [c1Start, progressPercent, isoDateToTimeStampSeconds(countDown)]
  }, [chapters, currentDate])

  const chapterNavs = useMemo(
    () => [
      {
        id: '1',
        index: 1,
        name: 'Chapters 1 and 2',
        isCompleted: false,
        available: currentDate > chapter1StartTime,
      },
      {
        id: '2',
        index: 2,
        name: 'All Chapters',
        isCompleted: false,
        available: false,
      },
    ],
    [chapter1StartTime, currentDate],
  )

  const renderActionMessage = useCallback(() => {
    if (targetCountdown || !storyReward.isChecked) {
      return <TextHeading className='font-archia text-2xl font-semibold'>{t('Are You a Winner?')}</TextHeading>
    }

    if (!targetCountdown && Boolean(storyReward.rewards)) {
      return (
        <div className='font-archia text-2xl font-semibold'>
          <span>{t('You Won')} </span>
          <RoundedTHETokenIcon className='inline h-7 w-7' />
          <span className='text-primary-500'>{` ${storyReward.rewards.amount} ${storyReward.rewards.type}`}</span>
        </div>
      )
    }

    if (!targetCountdown && !storyReward.rewards) {
      return (
        <TextHeading className='font-archia text-2xl font-semibold'>
          {t('Unfortunately You Didn’t Won Any Rewards')}
        </TextHeading>
      )
    }
  }, [targetCountdown, t])

  const renderActionButton = useCallback(() => {
    if (targetCountdown) {
      return (
        <EmphasisButton className='w-full lg:w-[140px]' disabled>
          TBA
        </EmphasisButton>
      )
    }

    if (!storyReward.isChecked) {
      return <PrimaryButton className='w-full lg:w-[140px]'>{t('Check now')}</PrimaryButton>
    }

    if (!storyReward.rewards) {
      return
    }

    if (storyReward.rewards.isClaimed) {
      return (
        <EmphasisButton className='w-full lg:w-[140px]' disabled>
          {t('Claimed')}
        </EmphasisButton>
      )
    }

    return <PrimaryButton className='w-full lg:w-[140px]'>{t('Claim')}</PrimaryButton>
  }, [targetCountdown, t])

  return (
    <div className='border-gradient-secondary w-full rounded-xl bg-neutral-900 p-[1px] lg:col-span-6 '>
      <div className='rounded-xl bg-neutral-900 p-4 lg:p-8'>
        <RewardChapterTabNavigator
          chapters={chapterNavs}
          selectedChapterIndex={selectedChapterIndex}
          setSelectedChapterIndex={setSelectedChapterIndex}
        />

        <div className='mb-4 mt-4 lg:mb-[60px] lg:mt-11'>
          <TextHeading className='font-archia text-3xl font-semibold'>
            <span>{t('Rewards in USD')}: </span>
            <span className='text-primary-600'>$16,000</span>
          </TextHeading>
        </div>

        <div className='grid grid-cols-2 lg:grid-cols-3'>
          {rewards.map((reward, index) => (
            <div
              key={reward.id}
              className={cn(
                'flex items-end justify-center',
                index === rewards.length - 1 ? 'col-span-2 lg:col-span-1' : 'col-span-1',
              )}
            >
              <HowItWorksItem
                key={reward.id}
                icon={reward.icon}
                title={reward.name}
                description={reward.description}
                className='w-auto p-0 md:w-full lg:p-6'
              />
            </div>
          ))}
        </div>

        <hr className='my-4 border-neutral-600' />

        <div className='flex flex-col items-center justify-between lg:flex-row'>
          {targetCountdown ? (
            <div className='font-medium'>
              <span className='text-neutral-300'>{t('Winners Announcement')}: </span>
              <CountDownAnnouncement timestamp={targetCountdown} className='font-bold text-neutral-50' />
            </div>
          ) : (
            <span className='font-bold text-neutral-50'>{t('The competition has ended')}</span>
          )}
          <div className='hidden lg:hidden'>
            <span className='font-light text-neutral-400'>{t('Selection method Raffle')} </span>
            <AlertCirlceSmallIcon className='inline h-4 w-4 cursor-pointer' />
          </div>
        </div>

        <div className='4 mb-6 mt-3 inline-block h-3 w-full rounded-md bg-neutral-500'>
          <div
            style={{
              width: `${chapterProgressPercent}%`,
            }}
            className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
          />
        </div>

        <div className='flex flex-col items-center justify-between gap-4 rounded-xl border-[1px] border-primary-700 bg-neutral-800 p-6 lg:flex-row lg:gap-0'>
          {renderActionMessage()}
          {renderActionButton()}
        </div>

        <div className='mt-4 flex items-center justify-center lg:hidden'>
          <span className='font-light text-neutral-400'>{t('Selection method Raffle')} </span>
          <AlertCirlceSmallIcon className='inline h-4 w-4 cursor-pointer' />
        </div>
      </div>
    </div>
  )
}
