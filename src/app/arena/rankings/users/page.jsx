'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import TopUser from '../TopUser'

function UserRankingPage() {
  const t = useTranslations()

  return (
    <div>
      <h2 className='mb-10 mt-10'>{t('User Rankings')}</h2>
      <TopUser />
    </div>
  )
}

export default UserRankingPage
