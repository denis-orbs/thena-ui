import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { TextHeading } from '@/components/typography'
import useWallet from '@/hooks/useWallet'
import { fetchCheckWinner } from '@/modules/Story'

import { CountDownAnnouncement } from '../CountDownAnnouncement'

// FIXME remove mocked data
// const isChecked = false

function RewardChapterFooter({ startTime, endTime, currentTabIndex }) {
  const { account } = useWallet()
  const t = useTranslations()
  const currentDate = dayjs()

  const { data: checkWinnerData, isLoading } = useSWR(['checkWinner', currentTabIndex, account], () =>
    fetchCheckWinner(currentTabIndex, account.toLowerCase()),
  )

  const [chapterProgressPercent, targetCountdown] = useMemo(() => {
    let progressPercent = 0
    if (endTime === null) {
      progressPercent = 0
    } else if (currentDate.isAfter(startTime) && currentDate.isBefore(endTime)) {
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
    if (targetCountdown || !endTime) {
      return <TextHeading className='font-archia text-2xl font-semibold'>{t('To Be Announced')}</TextHeading>
    }

    if (checkWinnerData?.isWinner) {
      return (
        <div className='flex flex-col justify-start'>
          <div className='font-archia text-2xl font-semibold'>
            <span>{t('You Won')}</span> &nbsp; <span className='text-primary-600'>{checkWinnerData?.reward}</span>
          </div>
          {checkWinnerData?.reward === '5+ characters THENA ID' && (
            <TextHeading>
              {t('Please open a Support ticket under THE Story category to receive your prize')}
            </TextHeading>
          )}
        </div>
      )
    }

    return (
      <TextHeading className='font-archia text-2xl font-semibold'>
        {t('Unfortunately You Didn’t Win Any Rewards')}
      </TextHeading>
    )
  }, [targetCountdown, endTime, checkWinnerData?.isWinner, checkWinnerData?.reward, t])

  if (isLoading) {
    return <Loading />
  }

  return (
    <>
      <div className='flex flex-col items-center justify-between lg:flex-row'>
        {!!targetCountdown && (
          <div className='font-medium'>
            <span className='text-neutral-300'>{t('Winners Announcement')}: </span>
            <CountDownAnnouncement timestamp={endTime.unix()} className='font-bold text-neutral-50' />
          </div>
        )}
        {endTime === null && (
          <div className='font-medium'>
            <span className='text-neutral-300'>{t('Winners Announcement')}: TBA</span>
          </div>
        )}
        {!targetCountdown && endTime !== null && (
          <span className='font-bold text-neutral-50'>{t('The competition has ended')}</span>
        )}
        <div>
          <span className='font-light text-neutral-400'>{t('Selection method Raffle')} </span>
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
      </div>

      <div className='mt-4 flex items-center justify-center lg:hidden'>
        <span className='font-light text-neutral-400'>{t('Selection method Raffle')} </span>
      </div>
    </>
  )
}

export default RewardChapterFooter
