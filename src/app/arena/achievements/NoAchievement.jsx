'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import Highlight from '@/components/highlight'
import { Paragraph } from '@/components/typography'
import { InfoCircleWhite } from '@/svgs'

function NoAchievement() {
  const t = useTranslations()

  return (
    <div className='px-6'>
      <div className='flex w-full flex-col items-center justify-center gap-4 py-40'>
        <Highlight>
          <InfoCircleWhite className='h-4 w-4' />
        </Highlight>
        <div className='flex w-72 flex-col items-center gap-3 lg:w-[416px]'>
          <h2>{t('No Achievement found')}</h2>

          <Paragraph className='mt-3 text-center'>{t('No Achievement found')}</Paragraph>
        </div>
      </div>
    </div>
  )
}

export default NoAchievement
