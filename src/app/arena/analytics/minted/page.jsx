'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React from 'react'

import { TextButton } from '@/components/buttons/Button'
import { MintedChart } from '@/modules/ArenaAnalytics/MintedChart'
import { ArrowLeftIcon } from '@/svgs'

function MintedAnalyticPage() {
  const t = useTranslations()

  return (
    <div className='mt-10 flex flex-col gap-4'>
      <Link href='/arena/analytics'>
        <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon}>
          {t('Back')}
        </TextButton>
      </Link>
      <MintedChart />
    </div>
  )
}

export default MintedAnalyticPage
