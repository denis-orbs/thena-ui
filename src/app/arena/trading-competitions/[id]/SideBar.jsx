'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

function Sidebar() {
  const t = useTranslations()

  return (
    <div className='col-span-12 lg:col-span-5'>
      <h3>{t('Registration')}</h3>
    </div>
  )
}

export default Sidebar
