'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React from 'react'

import { TextButton } from '@/components/buttons/Button'
import { VolumeChart } from '@/modules/ArenaAnalytics/VolumeChart'
import { ArrowLeftIcon } from '@/svgs'

function VolumeAnalyticPage() {
  const t = useTranslations()

  return (
    <div className='mt-10 space-y-4'>
      <Link href='/arena/analytics'>
        <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon}>
          {t('Back')}
        </TextButton>
      </Link>
      <VolumeChart />
    </div>
  )
}

export default VolumeAnalyticPage
