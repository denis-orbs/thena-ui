'use client'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { Paragraph, TextHeading } from '@/components/typography'
import { EVENT_TYPES, getEventType } from '@/lib/tradingCompetition/utils'
import { cn } from '@/lib/utils'

import { CompetitionCardHeader } from '../../CompetitionCardHeader'

dayjs.extend(utc)

function CompetitionCard({ competition }) {
  const t = useTranslations()

  const eventType = useMemo(() => getEventType(competition.timestamp), [competition.timestamp])

  const timestampToStatus = useMemo(() => {
    if (eventType === EVENT_TYPES.UPCOMING) {
      return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Upcoming')}</NeutralBadge>
    }

    if (eventType === EVENT_TYPES.LIVE) {
      return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Live')}</NeutralBadge>
    }

    if (eventType === EVENT_TYPES.ENDED) {
      return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Ended')}</NeutralBadge>
    }
  }, [eventType, t])

  const registerText = useMemo(() => {
    const now = Date.now() / 1000
    const register = competition.timestamp.registrationEnd
    const start = competition.timestamp.startTimestamp
    const end = competition.timestamp.endTimestamp

    return now > end
      ? t('Competition Has Ended')
      : register <= now && now < start
        ? t('Registration Closed')
        : start <= now && now <= end
          ? t('Competition Is Live')
          : dayjs.unix(Number(competition.timestamp.registrationEnd)).utc().format('MMM DD, YYYY HH:mm A UTC')
  }, [
    competition.timestamp.registrationEnd,
    competition.timestamp.startTimestamp,
    t,
    competition.timestamp.endTimestamp,
  ])

  const startTimeText = useMemo(() => {
    const now = Date.now() / 1000
    const end = competition.timestamp.endTimestamp
    const start = competition.timestamp.startTimestamp

    return now > end
      ? t('Competition Has Ended')
      : start <= now && now <= end
        ? t('Competition Is Live')
        : dayjs.unix(Number(competition.timestamp.startTimestamp)).utc().format('MMM DD, YYYY HH:mm A UTC')
  }, [competition.timestamp.endTimestamp, competition.timestamp.startTimestamp, t])

  const endTimeText = useMemo(() => {
    const now = Date.now() / 1000
    const end = competition.timestamp.endTimestamp

    return now > end
      ? t('Competition Has Ended')
      : dayjs.unix(Number(competition.timestamp.endTimestamp)).utc().format('MMM DD, YYYY HH:mm A UTC')
  }, [competition.timestamp.endTimestamp, t])

  return (
    <div className='w-full'>
      <Box className='flex h-full w-full cursor-pointer flex-col gap-4 p-6'>
        <div className='relative'>
          <CompetitionCardHeader className='h-72 max-w-full rounded-xl' competition={competition} />
          <div className='absolute left-4 top-4 flex gap-2'>
            <NeutralBadge className='text-nowrap capitalize lg:text-xs'>
              {competition.market.toLowerCase()}
            </NeutralBadge>
            {timestampToStatus}
          </div>
        </div>
        <div>
          <h3>{competition.name}</h3>
          <div
            className={cn(
              'flex w-full flex-col items-start gap-4 py-2 lg:flex-row lg:items-center',
              eventType !== EVENT_TYPES.ENDED ? 'justify-between' : 'space-x-8',
            )}
          >
            {eventType !== EVENT_TYPES.ENDED && (
              <div className='flex flex-col gap-1'>
                <TextHeading>{registerText}</TextHeading>
                <Paragraph>{t('Registration Deadline')}</Paragraph>
              </div>
            )}
            <div className='flex flex-col gap-1'>
              <TextHeading>{startTimeText}</TextHeading>
              <Paragraph>{t('Start')}</Paragraph>
            </div>
            <div className='flex flex-col gap-1'>
              <TextHeading>{endTimeText}</TextHeading>
              <Paragraph>{t('End')}</Paragraph>
            </div>
          </div>
        </div>
      </Box>
    </div>
  )
}

export default CompetitionCard
