'use client'

import isTomorow from 'dayjs/plugin/isTomorrow'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { Paragraph, TextHeading } from '@/components/typography'
import dayjs from '@/lib/arenaDayjs'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { cn } from '@/lib/utils'
import { EditBannerModal } from '@/modules/TradingCompetition/EditBannerModal'
import { EditIcon } from '@/svgs'

import { CompetitionCardHeader } from '../../CompetitionCardHeader'

dayjs.extend(isTomorow)

function CompetitionCard({ competition, eventType, enableEditBanner = false }) {
  const t = useTranslations()

  const [registerText, setRegisterText] = useState()
  const [startTimeText, setStartTimeText] = useState()
  const [endTimeText, setEndTimeText] = useState()
  const [isRegisterStarted, setIsRegisterStarted] = useState(false)
  const [editBannerModal, setEditBannerModal] = useState(false)

  const onEditBanner = useCallback(() => {
    setEditBannerModal(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const isSame = dayjs().isSame(dayjs.tz(competition.timestamp.registrationEnd * 1000), 'day')
      const now = dayjs().unix()
      const registerEndTime = competition.timestamp.registrationEnd
      const start = competition.timestamp.startTimestamp
      const registerStartTime = competition.timestamp.registrationStart
      if (eventType) {
        if (now <= registerStartTime) {
          setIsRegisterStarted(false)
          const isSameStart = dayjs().isSame(dayjs.tz(competition.timestamp.registrationStart * 1000), 'day')
          const isTomorrow = dayjs.tz(competition.timestamp.registrationStart * 1000).isTomorrow()
          setRegisterText(
            isSameStart
              ? `${t('Today')} ${dayjs.tz(Number(competition.timestamp.registrationStart) * 1000).format('HH:mm')}`
              : isTomorrow
                ? `${t('Tomorrow')} ${dayjs.tz(Number(competition.timestamp.registrationStart) * 1000).format('HH:mm')}`
                : dayjs.tz(Number(competition.timestamp.registrationStart) * 1000).format('MMM DD, YYYY HH:mm'),
          )
        } else {
          setIsRegisterStarted(true)
          const isTomorrow = dayjs.tz(competition.timestamp.registrationEnd * 1000).isTomorrow()
          setRegisterText(
            registerEndTime <= now && now < start
              ? t('Registration Closed')
              : eventType === EVENT_TYPES.LIVE
                ? t('Competition Is Live')
                : isSame
                  ? `${t('Today')} ${dayjs.tz(Number(competition.timestamp.registrationEnd) * 1000).format('HH:mm')}`
                  : isTomorrow
                    ? `${t('Tomorrow')} ${dayjs
                        .tz(Number(competition.timestamp.registrationEnd) * 1000)
                        .format('HH:mm')}`
                    : dayjs.tz(Number(competition.timestamp.registrationEnd) * 1000).format('MMM DD, YYYY HH:mm'),
          )
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [
    competition.timestamp.registrationEnd,
    competition.timestamp.registrationStart,
    competition.timestamp.startTimestamp,
    eventType,
    t,
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      const isSame = dayjs().isSame(dayjs.tz(competition.timestamp.startTimestamp * 1000), 'day')
      const isTomorrow = dayjs.tz(competition.timestamp.startTimestamp * 1000).isTomorrow()

      if (eventType) {
        setStartTimeText(
          eventType === EVENT_TYPES.ENDED
            ? t('Competition Has Ended')
            : eventType === EVENT_TYPES.LIVE
              ? t('Competition Is Live')
              : isSame
                ? `${t('Today')} ${dayjs.tz(Number(competition.timestamp.startTimestamp) * 1000).format('HH:mm')}`
                : isTomorrow
                  ? `${t('Tomorrow')} ${dayjs.tz(Number(competition.timestamp.startTimestamp) * 1000).format('HH:mm')}`
                  : dayjs.tz(Number(competition.timestamp.startTimestamp) * 1000).format('MMM DD, YYYY HH:mm'),
        )
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [competition.timestamp.startTimestamp, eventType, t])

  useEffect(() => {
    const interval = setInterval(() => {
      const isSame = dayjs().isSame(dayjs.tz(competition.timestamp.endTimestamp * 1000), 'day')
      const isTomorrow = dayjs.tz(competition.timestamp.endTimestamp * 1000).isTomorrow()

      if (eventType) {
        setEndTimeText(
          eventType === EVENT_TYPES.ENDED
            ? t('Competition Has Ended')
            : isSame
              ? `${t('Today')} ${dayjs.tz(Number(competition.timestamp.endTimestamp) * 1000).format('HH:mm')}`
              : isTomorrow
                ? `${t('Tomorrow')} ${dayjs.tz(Number(competition.timestamp.endTimestamp) * 1000).format('HH:mm')}`
                : dayjs.tz(Number(competition.timestamp.endTimestamp) * 1000).format('MMM DD, YYYY HH:mm'),
        )
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [competition.timestamp.endTimestamp, eventType, t])

  return (
    <>
      <div className='w-full'>
        <Box className='flex h-full w-full flex-col gap-4 p-6'>
          <div className='relative'>
            <CompetitionCardHeader
              className='h-72 max-w-full rounded-xl'
              competition={competition}
              banner={competition.bannerUrl}
            />
            <div className='absolute left-4 top-4 flex gap-2'>
              <NeutralBadge className='text-nowrap capitalize lg:text-xs'>
                {competition.market.toLowerCase()}
              </NeutralBadge>
              {eventType && <NeutralBadge className='text-nowrap lg:text-xs'>{t(eventType)}</NeutralBadge>}
            </div>
            {enableEditBanner && (
              <EmphasisIconButton Icon={EditIcon} className='absolute right-4 top-4' onClick={onEditBanner} />
            )}
          </div>
          <div>
            <h3>{competition.name}</h3>
            {eventType && (
              <div
                className={cn(
                  'flex w-full flex-col items-start gap-4 py-2 lg:flex-row lg:items-center',
                  eventType !== EVENT_TYPES.ENDED ? 'justify-between' : 'space-x-8',
                )}
              >
                {eventType !== EVENT_TYPES.ENDED && (
                  <div className='flex flex-col gap-1'>
                    <TextHeading>{registerText}</TextHeading>
                    <Paragraph>
                      {isRegisterStarted ? t('Registration Deadline') : t('Registration Start Time')}
                    </Paragraph>
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
            )}
          </div>
        </Box>
      </div>
      {editBannerModal && (
        <EditBannerModal competition={competition} open={editBannerModal} onClose={() => setEditBannerModal(false)} />
      )}
    </>
  )
}

export default CompetitionCard
