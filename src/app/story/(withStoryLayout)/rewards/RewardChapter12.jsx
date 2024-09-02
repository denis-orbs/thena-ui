import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { useTHEStory } from '@/context/THEStoryContext'
import { cn, isoDateToTimeStampSeconds } from '@/lib/utils'
import { HowItWorksItem } from '@/modules/Story/HowItWorksItem'
import { AlertCirlceSmallIcon, BankIcon, FingerprintIcon, THETokenIcon } from '@/svgs'

import { CountDownAnnouncement } from './CountDownAnnouncement'

// FIXME remove mocked data
const isChecked = true
const isClaimed = false
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

export function RewardChapter12({ chapters }) {
  const t = useTranslations()
  const { campaignParticipantInfo: userInfo } = useTHEStory()
  const currentDate = useMemo(() => new Date(), [])

  const [chapterProgressPercent, targetCountdown] = useMemo(() => {
    const startTime = new Date(chapters?.[0]?.startTimestamp ?? 0)
    const endTime = new Date(chapters?.[1]?.endTimestamp ?? 0)

    let progressPercent = 0
    if (currentDate > startTime && currentDate < endTime) {
      progressPercent = ((currentDate - startTime) * 100) / (endTime - startTime)
    } else if (currentDate >= endTime) {
      progressPercent = 100
    }

    let countDown = startTime
    if (currentDate > startTime && currentDate < endTime) {
      countDown = endTime
    } else if (currentDate >= endTime) {
      countDown = undefined
    }

    return [progressPercent, isoDateToTimeStampSeconds(countDown)]
  }, [chapters, currentDate])

  const renderActionMessage = useCallback(() => {
    if (targetCountdown || !isChecked) {
      // if (!targetCountdown || !isChecked) {
      return <TextHeading className='font-archia text-2xl font-semibold'>{t('Are You a Winner?')}</TextHeading>
    }

    const rank = userInfo.rankFirstTwoChapters
    // const rank = 102
    if (rank === 0) {
      return (
        <div className='flex flex-row items-center justify-center font-archia text-2xl font-semibold'>
          <span>{t('You Won')} </span>
          <div className='mx-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500'>
            <FingerprintIcon class='inline h-4 w-4' />
          </div>
          <span className='text-primary-500'>1 THENA ID</span>
        </div>
      )
    }
    if (rank === 1 || rank === 2) {
      return (
        <div className='flex flex-row items-center justify-center font-archia text-2xl font-semibold'>
          <span>{t('You Won')} </span>
          <div className='mx-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500'>
            <BankIcon class='inline h-4 w-4' />
          </div>
          <span className='text-primary-500'>1 theNFTs</span>
        </div>
      )
    }
    if (rank <= 102) {
      return (
        <div className='flex flex-row items-center justify-center font-archia text-2xl font-semibold'>
          <span>{t('You Won')} </span>
          <div className='mx-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500'>
            <THETokenIcon class='inline h-4 w-4' />
          </div>
          <span className='text-primary-500'>100 THE Tokens</span>
        </div>
      )
    }
    return (
      <TextHeading className='font-archia text-2xl font-semibold'>
        {t('Unfortunately You Didn’t Won Any Rewards')}
      </TextHeading>
    )
  }, [targetCountdown, t, userInfo.rankFirstTwoChapters])

  const renderActionButton = useCallback(() => {
    if (targetCountdown) {
      return (
        <EmphasisButton className='w-full lg:w-[140px]' disabled>
          TBA
        </EmphasisButton>
      )
    }
    if (!isChecked) {
      return <PrimaryButton className='w-full lg:w-[140px]'>{t('Check now')}</PrimaryButton>
    }
    if (!userInfo.rankFirstTwoChapters > 102) {
      return
    }
    if (isClaimed) {
      return (
        <EmphasisButton className='w-full lg:w-[140px]' disabled>
          {t('Claimed')}
        </EmphasisButton>
      )
    }
    return <PrimaryButton className='w-full lg:w-[140px]'>{t('Claim')}</PrimaryButton>
  }, [targetCountdown, t, userInfo.rankFirstTwoChapters])

  return (
    <>
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
              'flex items-start justify-center',
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
    </>
  )
}
