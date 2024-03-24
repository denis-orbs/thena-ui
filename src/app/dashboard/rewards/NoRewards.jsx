'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import { Paragraph } from '@/components/typography'
import { InfoCircleWhite } from '@/svgs'

export function NoRewards() {
  const { push } = useRouter()
  const t = useTranslations()

  return (
    <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
      <Highlight>
        <InfoCircleWhite className='h-4 w-4' />
      </Highlight>
      <div className='flex flex-col items-center gap-3'>
        <h2>{t('No Rewards Found')}</h2>
        <Paragraph className='mt-3 text-center'>{t('No Rewards to Display')}</Paragraph>
      </div>
      <PrimaryButton onClick={() => push('/dashboard/vote')}>{t('Explore Votes')}</PrimaryButton>
    </div>
  )
}
