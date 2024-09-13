import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import Skeleton from '@/components/skeleton'
import CustomTooltip from '@/components/tooltip'
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
              <InfoNeutralIcon className='ml-1 w-4' data-tooltip-id='active-users-tooltip' />
              <CustomTooltip
                className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
                id='active-users-tooltip'
                place='bottom'
              >
                Total users who have completed at least 1 task
              </CustomTooltip>
            </TextSubHeading>
          </Box>

          <Box className='flex flex-col gap-2 bg-neutral-900'>
            <TextHeading className='text-2xl'>{statsCampaignParticipant?.registeredReferralCount}</TextHeading>
            <TextSubHeading className='flex items-center text-sm text-neutral-300'>
              {t('Registered Referrals')}
              <InfoNeutralIcon className='ml-1 w-4' data-tooltip-id='registered-referrals-tooltip' />
              <CustomTooltip
                className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
                id='registered-referrals-tooltip'
                place='bottom'
              >
                Total users registered via the referral link
              </CustomTooltip>
            </TextSubHeading>
          </Box>

          <Box className='flex flex-col gap-2 bg-neutral-900'>
            <TextHeading className='text-2xl'>{statsCampaignParticipant?.successReferralCount}</TextHeading>
            <TextSubHeading className='flex items-center text-sm text-neutral-300'>
              {t('Successful Referrals')}
              <InfoNeutralIcon className='ml-1 w-4' data-tooltip-id='success-referrals-tooltip' />
              <CustomTooltip
                className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
                id='success-referrals-tooltip'
                place='bottom'
              >
                Total users registered via the referral link who have completed at least 1 task
              </CustomTooltip>
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
