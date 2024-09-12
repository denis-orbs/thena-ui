import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import Skeleton from '@/components/skeleton'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { InfoNeutralIcon } from '@/svgs'

function ItemLoading() {
  return (
    <Box className='flex flex-col gap-2 bg-neutral-900'>
      <Skeleton className='h-6 w-[20%]' />
      <Skeleton className='h-6 w-[60%]' />
    </Box>
  )
}

function StatsCampaignParticipant({ statsCampaignParticipant, isLoading }) {
  const t = useTranslations()
  return (
    <>
      {!isLoading && statsCampaignParticipant ? (
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          <Box className='flex flex-col gap-2 bg-neutral-900'>
            <TextHeading className='text-2xl'>{statsCampaignParticipant?.registeredUserCount}</TextHeading>
            <TextSubHeading className='text-sm text-neutral-300'>{t('Registered Users')}</TextSubHeading>
          </Box>

          <Box className='flex flex-col gap-2 bg-neutral-900'>
            <TextHeading className='text-2xl'>{statsCampaignParticipant?.activeUserCount}</TextHeading>
            <TextSubHeading className='flex items-center text-sm text-neutral-300'>
              {t('Active Users')}
              <span className='ml-1'>
                <InfoNeutralIcon className='w-4' />
              </span>
            </TextSubHeading>
          </Box>

          <Box className='flex flex-col gap-2 bg-neutral-900'>
            <TextHeading className='text-2xl'>{statsCampaignParticipant?.registeredReferralCount}</TextHeading>
            <TextSubHeading className='flex items-center text-sm text-neutral-300'>
              {t('Registered Referrals')}
              <span className='ml-1'>
                <InfoNeutralIcon className='w-4' />
              </span>
            </TextSubHeading>
          </Box>

          <Box className='flex flex-col gap-2 bg-neutral-900'>
            <TextHeading className='text-2xl'>{statsCampaignParticipant?.successReferralCount}</TextHeading>
            <TextSubHeading className='flex items-center text-sm text-neutral-300'>
              {t('Successful Referrals')}
              <span className='ml-1'>
                <InfoNeutralIcon className='w-4' />
              </span>
            </TextSubHeading>
          </Box>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          <ItemLoading />
          <ItemLoading />
          <ItemLoading />
          <ItemLoading />
        </div>
      )}
    </>
  )
}

export default StatsCampaignParticipant
