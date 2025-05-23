'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import MenuTab from '../MenuTab'
import ThenaContent from '../ThenaContent'

function MintPage() {
  const t = useTranslations()

  return (
    <div>
      <div className='mt-6'>
        <h2>{t('THENA ID')}</h2>
      </div>
      <MenuTab />
      <ThenaContent />
    </div>
  )
}

export default MintPage
