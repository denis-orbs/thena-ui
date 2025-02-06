import { useTranslations } from 'next-intl'
import React from 'react'

import { TextHeading } from '@/components/typography'

function HistoryContract() {
  const t = useTranslations()
  return (
    <div className='space-y-4'>
      <TextHeading className='text-2xl lg:text-3xl'>{t('History')}</TextHeading>
    </div>
  )
}

export default HistoryContract
