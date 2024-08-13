'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import StoryRegister from '@/modules/Story/StoryRegister'

function StoryPage() {
  const t = useTranslations()
  return (
    <div className='mt-6 flex flex-col gap-4'>
      <div className='w-full'>
        <div className='mt-6 grid grid-cols-12 gap-8 lg:gap-12'>
          <div className='col-span-12 my-auto px-20 lg:col-span-7'>
            <small className='font-semibold uppercase text-gradient'>{t('The story of Thena')}</small>
            <p className='mb-3 text-4xl font-black text-white'>{t('Join the Adventure and Earn Rewards!')}</p>
            <small>{t('Brief Campaign Description Brief Campaign DescriptionBrief Campaign Description')}</small>
            <small>{t('DescriptionBrief Campaign Description')}</small>
          </div>
          <StoryRegister />
        </div>
      </div>
    </div>
  )
}

export default StoryPage
