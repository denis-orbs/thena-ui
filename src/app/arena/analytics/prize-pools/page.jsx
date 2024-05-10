'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React from 'react'

import { TextButton } from '@/components/buttons/Button'
import { PrizePoolChart } from '@/modules/ArenaAnalytics/PrizePoolChart'
import { ArrowLeftIcon } from '@/svgs'

function PrizePoolAnalyticPage() {
  const t = useTranslations()

  return (
    <div className='mt-10 space-y-4'>
      <Link href='/arena/analytics'>
        <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon}>
          {t('Back')}
        </TextButton>
      </Link>
      <PrizePoolChart />
    </div>
  )
}

export default PrizePoolAnalyticPage
