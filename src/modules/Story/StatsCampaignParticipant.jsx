import { useTranslations } from 'next-intl'
import React, { useId } from 'react'

import Box from '@/components/box'
import Skeleton from '@/components/skeleton'
import CustomTooltip from '@/components/tooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import useWallet from '@/hooks/useWallet'
import { InfoNeutralIcon } from '@/svgs'

function ItemLoading() {
  return (
    <Box className='flex flex-col gap-2 bg-neutral-900'>
      <Skeleton className='h-6 w-[20%]' />
      <Skeleton className='h-6 w-[60%]' />
    </Box>
  )
}

function StatsItem({ title, value, tooltip = null }) {
  return (
    <Box className='flex flex-col gap-2 bg-neutral-900'>
      <TextHeading className='text-2xl'>{value ?? '-'}</TextHeading>
      <TextSubHeading className='flex items-center text-sm text-neutral-300'>
        {title}
        {tooltip && (
          <>
            <InfoNeutralIcon className='ml-1 w-4' data-tooltip-id='success-referrals-tooltip' />
            <CustomTooltip
              className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
              id='success-referrals-tooltip'
              place='bottom'
            >
              {tooltip}
            </CustomTooltip>
          </>
        )}
      </TextSubHeading>
    </Box>
  )
}

function LoadingBlock({ block, gridCols }) {
  const elements = []
  for (let i = 0; i < block; i++) {
    elements.push(<ItemLoading key={i} />)
  }
  return <div className={`grid grid-cols-2 gap-4 lg:grid-cols-${gridCols}`}>{elements}</div>
}

function StatsCampaignParticipant({ statsCampaignParticipant, isLoadingInfo, isLoadingStats, userInfo }) {
  const { account } = useWallet()
  const t = useTranslations()

  const keyId = useId()

  const metricChapter = statsCampaignParticipant?.chapterMetrics
  if (!isLoadingStats && metricChapter?.length < 8) {
    for (let i = metricChapter.length; i < 8; i++) {
      metricChapter.push({
        activeParticipants: '-',
        chapter: i,
        completedParticipants: '-',
      })
    }
  }
  return (
    <>
      <div className='mb-3 mt-6'>
        <TextHeading className='font-archia text-xl font-semibold lg:text-3xl'>{t('Global Stats')}</TextHeading>
      </div>
      {!isLoadingStats &&
      !isLoadingInfo &&
      account &&
      userInfo &&
      (userInfo.isAdmin || userInfo.isSuperAdmin) &&
      statsCampaignParticipant ? (
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
          <StatsItem title={t('Registered Users')} value={statsCampaignParticipant?.registeredUserCount} />
          <StatsItem
            title={t('Users Completed All Tasks')}
            value={statsCampaignParticipant?.userCompletedAllTasksCount}
          />
          <StatsItem title={t('Users Completed 1 Task Min')} value={statsCampaignParticipant?.activeUserCount} />
          <StatsItem
            title={t('Registered Referrals')}
            value={statsCampaignParticipant?.registeredReferralCount}
            tooltip='Total users registered via the referral link'
          />
          <StatsItem
            title={t('Successful Referrals')}
            value={statsCampaignParticipant?.successReferralCount}
            tooltip='Total users registered via the referral link who have completed at least 1 task'
          />
        </div>
      ) : (
        <LoadingBlock block={5} gridCols={5} />
      )}
      <div className='mb-3 mt-6'>
        <TextHeading className='font-archia text-xl font-semibold lg:text-3xl'>{t('Completed Chapters')}</TextHeading>
      </div>
      {!isLoadingStats &&
      !isLoadingInfo &&
      account &&
      userInfo &&
      (userInfo.isAdmin || userInfo.isSuperAdmin) &&
      statsCampaignParticipant ? (
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          {metricChapter.map(item => (
            <StatsItem key={keyId} title={`${t('Chapter')} ${item?.chapter}`} value={item.activeParticipants} />
          ))}
        </div>
      ) : (
        <LoadingBlock block={8} gridCols={4} />
      )}
    </>
  )
}

export default StatsCampaignParticipant
