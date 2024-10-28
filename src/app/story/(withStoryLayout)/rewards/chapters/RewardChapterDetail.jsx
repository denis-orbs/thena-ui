import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import React from 'react'

import Loading from '@/app/loading'
import { TextHeading } from '@/components/typography'
import { cn, formatAmount } from '@/lib/utils'
import { fetchCampaignChapterRewards } from '@/modules/Story'
import { HowItWorksItem } from '@/modules/Story/HowItWorksItem'

function RewardChapterDetail({ chapter }) {
  const t = useTranslations()
  const { data: rewards, isLoading } = useQuery({
    queryKey: ['fetchCampaignChapterRewards', chapter.index],
    queryFn: () => fetchCampaignChapterRewards(chapter.index === 2 ? '1&2' : chapter.index.toString()),
    refetchInterval: 30000,
  })

  if (isLoading) return <Loading />

  return (
    <>
      <div className='mb-4 mt-4 lg:mb-[60px] lg:mt-11'>
        <TextHeading className='font-archia text-3xl font-semibold'>
          <span>{t('Rewards in USD')}: </span>
          <span className='text-primary-600'>
            {chapter?.totalRewardUSD ? `$${formatAmount(chapter?.totalRewardUSD)}` : 'TBA'}
          </span>
        </TextHeading>
      </div>

      <div
        className={cn(
          'grid grid-cols-2',
          rewards?.length && rewards.length >= 3 ? 'lg:grid-cols-3' : `lg:grid-cols-${rewards?.length ?? 2}`,
        )}
      >
        {rewards?.map((item, index) => (
          <div
            key={item?.id}
            className={cn(
              'flex items-start justify-center',
              index === (rewards.length % 2 === 1 && rewards.length - 1) ? 'col-span-2 lg:col-span-1' : 'col-span-1',
            )}
          >
            <HowItWorksItem
              key={item?.id}
              icon={item?.icon}
              title={item?.name}
              description={item?.description}
              className='w-auto p-0 md:w-full lg:p-6'
            />
          </div>
        ))}
      </div>

      <hr className='my-4 border-neutral-600' />
    </>
  )
}

export default RewardChapterDetail
