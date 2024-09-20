import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { useTHEStory } from '@/context/THEStoryContext'
import { AlertCirlceSmallIcon } from '@/svgs'

import { CountDownAnnouncement } from '../CountDownAnnouncement'

// FIXME remove mocked data
const isChecked = true
const isClaimed = false

function RewardChapterFooter({ startTime, endTime }) {
  const t = useTranslations()
  const currentDate = dayjs()
  const { campaignParticipantInfo: userInfo } = useTHEStory()

  const [chapterProgressPercent, targetCountdown] = useMemo(() => {
    // const startTime = dayjs(chapters?.[0]?.startTimestamp ?? 0)
    // const endTime = chapters?.[1]?.endTimestamp ? dayjs(chapters[1].endTimestamp).add(1, 'weeks') : dayjs(0)

    let progressPercent = 0
    if (currentDate.isAfter(startTime) && currentDate.isBefore(endTime)) {
      progressPercent = ((currentDate.unix() - startTime.unix()) * 100) / (endTime.unix() - startTime.unix())
    } else if (currentDate.isAfter(endTime)) {
      progressPercent = 100
    }

    let countDown = endTime
    if (currentDate.isAfter(endTime)) {
      countDown = undefined
    }

    return [progressPercent, countDown?.unix() || 0]
  }, [currentDate, endTime, startTime])

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
        </div>
      )
    }
    if (rank === 1 || rank === 2) {
      return (
        <div className='flex flex-row items-center justify-center font-archia text-2xl font-semibold'>
          <span>{t('You Won')} </span>
        </div>
      )
    }
    if (rank <= 102) {
      return (
        <div className='flex flex-row items-center justify-center font-archia text-2xl font-semibold'>
          <span>{t('You Won')} </span>
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

export default RewardChapterFooter
