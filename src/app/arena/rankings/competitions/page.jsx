'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React from 'react'

import { TextButton } from '@/components/buttons/Button'
import { ArrowLeftIcon } from '@/svgs'

import TopCompetition from '../TopCompetition'

function CompetitionRakingPage() {
  const t = useTranslations()

  return (
    <div>
      <div className='sticky top-[128px] z-20 flex min-h-11 items-center justify-between bg-[#120916] bg-opacity-20 px-1 pb-2 pt-4 backdrop-blur-2xl lg:top-[150px] lg:mb-4 lg:pt-10'>
        <Link href='/arena/rankings'>
          <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon}>
            {t('Back')}
          </TextButton>
        </Link>
      </div>
      <div>
        <h2 className='mb-10'>Competition rankings</h2>
      </div>
      <TopCompetition />
    </div>
  )
}

export default CompetitionRakingPage
