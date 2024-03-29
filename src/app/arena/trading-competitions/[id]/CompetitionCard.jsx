'use client'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Cover from 'public/cover.png'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { ArrowLeftIcon } from '@/svgs'

dayjs.extend(utc)

function CompetitionCard({ competition }) {
  const t = useTranslations()
  const { push } = useRouter()

  const timestampToStatus = useMemo(() => {
    if (competition?.timestamp.startTimestamp > new Date().getTime() / 1000) {
      return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Upcoming')}</NeutralBadge>
    }

    if (
      competition.timestamp.startTimestamp <= new Date().getTime() / 1000 &&
      new Date().getTime() / 1000 <= competition.timestamp.endTimestamp
    ) {
      return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Live')}</NeutralBadge>
    }

    if (competition.timestamp.endTimestamp < new Date().getTime() / 1000) {
      return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Ended')}</NeutralBadge>
    }
  }, [competition.timestamp.endTimestamp, competition.timestamp.startTimestamp, t])

  return (
    <div className='w-full'>
      <div className='mb-4 flex min-h-11 items-center justify-between'>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/arena')}>
          {t('Back')}
        </TextButton>

        <div className='flex items-center justify-center gap-2'>
          <CircleImage src={Avatar} alt='avatar' className='size-8' />
          <Paragraph>{`${competition.owner.id.slice(0, 6)}...${competition.owner.id.slice(-4)}`}</Paragraph>
        </div>
      </div>
      <Box className='flex h-full w-full cursor-pointer flex-col gap-4 p-6'>
        <div className='relative'>
          <Image className='h-72 max-w-full rounded-xl' src={Cover} alt='image' />
          <div className='absolute left-4 top-4 flex gap-2'>
            <NeutralBadge className='text-nowrap capitalize lg:text-xs'>
              {competition.market.toLowerCase()}
            </NeutralBadge>
            {timestampToStatus}
          </div>
        </div>
        <div>
          <h3>{competition.name}</h3>
          <div className='flex w-full flex-col items-start justify-between gap-4 py-2 lg:flex-row lg:items-center'>
            <div className='flex flex-col gap-1'>
              <TextHeading>
                {dayjs.unix(Number(competition.timestamp.startTimestamp)).utc().format('MMM DD, YYYY HH:mm A UTC')}
              </TextHeading>
              <Paragraph>{t('Start')}</Paragraph>
            </div>
            <div className='flex flex-col gap-1'>
              <TextHeading>
                {dayjs.unix(Number(competition.timestamp.endTimestamp)).utc().format('MMM DD, YYYY HH:mm A UTC')}
              </TextHeading>
              <Paragraph>{t('End')}</Paragraph>
            </div>
            <div className='flex flex-col gap-1'>
              <TextHeading>
                {dayjs.unix(Number(competition.timestamp.registrationEnd)).utc().format('MMM DD, YYYY HH:mm A UTC')}
              </TextHeading>
              <Paragraph>{t('Registration Deadline')}</Paragraph>
            </div>
          </div>
        </div>
      </Box>
    </div>
  )
}

export default CompetitionCard
