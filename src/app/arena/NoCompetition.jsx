'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import Highlight from '@/components/highlight'
import { Paragraph } from '@/components/typography'
import InfoIcon from '@/icons/InfoIcon'

function NoCompetition() {
  const t = useTranslations()

  return (
    <div className='px-6'>
      <div className='flex w-full flex-col items-center justify-center gap-4 py-40'>
        <Highlight>
          <InfoIcon className='stroke-neutral-50' />
        </Highlight>
        <div className='flex w-72 flex-col items-center gap-3 lg:w-[416px]'>
          <h2>{t('No Competitions Found')}</h2>

          <Paragraph className='mt-3 text-center'>{t('No Competitions Description')}</Paragraph>
        </div>
      </div>
    </div>
  )
}

export default NoCompetition
