'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import TopCompetition from '../TopCompetition'

function CompetitionRakingPage() {
  const t = useTranslations()

  return (
    <div>
      <div>
        <h2 className='mb-10 mt-10'>{t('Competition Rankings')}</h2>
      </div>
      <TopCompetition />
    </div>
  )
}

export default CompetitionRakingPage
