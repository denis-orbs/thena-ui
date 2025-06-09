import { useTranslations } from 'next-intl'
import React from 'react'

import { TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, PAIR_TYPES } from '@/constant'
import { formatAmount } from '@/lib/utils'

function APR({ currentPrice, minPrice, maxPrice, positionType, apr = 0, title }) {
  const t = useTranslations()
  const outOfRange = currentPrice ? currentPrice < minPrice || currentPrice >= maxPrice : false
  const aprValue =
    (positionType === PAIR_TYPES.LSD || positionType === 'Manual') &&
    ![...GAMMA_TYPES, ...ICHI_TYPES].includes(title) &&
    outOfRange
      ? 0
      : apr

  return (
    <div className='flex flex-col max-xl:flex-1'>
      <TextHeading>{formatAmount(aprValue)}%</TextHeading>
      <TextSubHeading className='font-medium xl:text-base'>{t('APR')}</TextSubHeading>
    </div>
  )
}

export default APR
