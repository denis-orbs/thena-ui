import { useTranslations } from 'next-intl'
import React from 'react'

import { TextHeading } from '@/components/typography'

export function SearchSeeAll({ onClick, count }) {
  const t = useTranslations()

  return (
    <TextHeading
      className='my-4 cursor-pointer bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text text-sm text-transparent'
      onClick={onClick}
    >
      {t('See All Result', {
        value: count,
      })}
    </TextHeading>
  )
}
