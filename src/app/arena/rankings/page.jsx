'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import TopCompetition from './TopCompetition'
import TopUser from './TopUser'

function RankingPage() {
  const t = useTranslations()

  return (
    <div>
      <div className='mt-6'>
        <h2>{t('Rankings')}</h2>
      </div>
      <div className='mt-6 grid grid-cols-12 gap-8 lg:gap-12'>
        <TopUser />
        <TopCompetition />
      </div>
    </div>
  )
}

export default RankingPage
