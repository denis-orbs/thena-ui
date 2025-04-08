'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import { NewTextSubHeading } from '@/components/typography'

import UserAssets from './Assets'
import HeaderRewards from './HeaderRewards'
import Overview from './Overview'
import DashBoardProfile from './Profile'
import TheNFT from './theNFT'

function Dashboard() {
  const t = useTranslations()
  return (
    <div className='flex flex-col gap-4'>
      <HeaderRewards />
      <div className='mt-[104px] flex flex-col gap-2 md:mt-[278px]'>
        <NewTextSubHeading>{t('My Assets')}</NewTextSubHeading>
        <UserAssets />
      </div>
      <Overview />
      <div className='grid grid-cols-1 md:grid-cols-3 md:gap-4'>
        <div className='col-span-1'>
          <TheNFT />
        </div>
        <div className='col-span-2'>
          <DashBoardProfile />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
