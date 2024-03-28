'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Cover from 'public/cover.png'
import React from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import { ArrowLeftIcon } from '@/svgs'

function CompetitionCard({ competition }) {
  const t = useTranslations()
  const { push } = useRouter()

  const isUpcoming = competition?.timestamp.startTimestamp > new Date().getTime() / 1000

  const isLive =
    competition.timestamp.startTimestamp <= new Date().getTime() / 1000 &&
    new Date().getTime() / 1000 <= competition.timestamp.endTimestamp

  const isEnded = competition.timestamp.endTimestamp < new Date().getTime() / 1000

  const timestampToStatus = () => {
    if (isUpcoming) return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Upcoming')}</NeutralBadge>

    if (isLive) return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Live')}</NeutralBadge>

    if (isEnded) return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Ended')}</NeutralBadge>
  }

  return (
    <div className='w-full'>
      <div className='mb-4 flex min-h-11 justify-between'>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/arena')}>
          {t('Back')}
        </TextButton>

        <div>Fist name</div>
      </div>
      <Box className='flex w-full cursor-pointer flex-col gap-4 p-6'>
        <div className='relative'>
          <Image className='h-auto w-full rounded-xl' src={Cover} alt='image' />
          <div className='absolute left-4 top-4 flex gap-2'>
            <NeutralBadge className='text-nowrap capitalize lg:text-xs'>
              {competition.market.toLowerCase()}
            </NeutralBadge>
            {timestampToStatus()}
          </div>
        </div>
        <div>
          <h3>{competition.name}</h3>
          <div className='flex w-full items-center justify-between gap-4 py-2'>
            {/* <Paragraph className='flex gap-1'>
              <div>{new Date(competition.timestamp.startTimestamp)}</div>
            </Paragraph>
            <Paragraph className='flex gap-1'>
              <div>{new Date(competition.timestamp.endTimestamp)}</div>
            </Paragraph>
            <Paragraph className='flex gap-1'>
              <div>{new Date(competition.timestamp.registrationEnd)}</div>
            </Paragraph> */}
          </div>
        </div>
      </Box>
    </div>
  )
}

export default CompetitionCard
