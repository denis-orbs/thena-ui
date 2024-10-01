import { useTranslations } from 'next-intl'
import React from 'react'

import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { HowItWorksItem } from '@/modules/Story/HowItWorksItem'

function RewardChapterDetail({ rewards }) {
  const t = useTranslations()

  return (
    <>
      <div className='mb-4 mt-4 lg:mb-[60px] lg:mt-11'>
        <TextHeading className='font-archia text-3xl font-semibold'>
          <span>{t('Rewards in USD')}: </span>
          <span className='text-primary-600'>${rewards?.rewardsInUSD ? rewards?.rewardsInUSD : 'TBA'}</span>
        </TextHeading>
      </div>

      <div
        className={cn(
          'grid grid-cols-2',
          rewards?.items?.length && rewards.items.length >= 3
            ? 'lg:grid-cols-3'
            : `lg:grid-cols-${rewards.items.length}`,
        )}
      >
        {rewards?.items?.map((reward, index) => (
          <div
            key={reward?.id}
            className={cn(
              'flex items-start justify-center',
              index === (rewards.length % 2 === 1 && rewards.length - 1) ? 'col-span-2 lg:col-span-1' : 'col-span-1',
            )}
          >
            <HowItWorksItem
              key={reward?.id}
              icon={reward?.icon}
              title={reward?.name}
              description={reward?.description}
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
