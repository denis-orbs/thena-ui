import { useTranslations } from 'next-intl'
import React from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { NewTextHeading, TextHeading } from '@/components/typography'

function AssetsOverview() {
  const t = useTranslations()
  return (
    <div className='space-y-4'>
      <TextHeading className='font-archia'>{t('Total Value Provided')}</TextHeading>
      <div className='grid grid-cols-1 md:grid-cols-2'>
        <div className='flex flex-col gap-8'>
          <TextHeading className='font-archia text-4xl'>
            $11,123.87 5 <span className='uppercase'>{t('Pools')}</span>
          </TextHeading>
          <TextHeading className='font-archia text-4xl'>{t('Generated Fees and Rewards')}</TextHeading>
          <NewTextHeading className='text-primary-600'>${1350.89}</NewTextHeading>
          <PrimaryButton className='w-fit'>{t('Claim All Rewards')}</PrimaryButton>
        </div>
        <div className='h-full'>Pie chart here</div>
      </div>
    </div>
  )
}

export default AssetsOverview
