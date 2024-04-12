'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { Paragraph, TextHeading } from '@/components/typography'

function AnalyticPage() {
  const t = useTranslations()

  return (
    <>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <TextHeading className='text-xl lg:flex-1'>{t('Analytics')}</TextHeading>
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Box className='relative'>
          <NeutralBadge className='absolute right-4 top-4 flex gap-2 text-nowrap capitalize lg:text-xs'>
            30%
          </NeutralBadge>
          <div className='flex flex-col gap-4'>
            <TextHeading className='text-xl'>$598.38</TextHeading>
            <Paragraph className='text-sm'>{t('Total volume')}</Paragraph>
          </div>
        </Box>
        <Box className='relative'>
          <NeutralBadge className='absolute right-4 top-4 flex gap-2 text-nowrap capitalize lg:text-xs'>
            32%
          </NeutralBadge>
          <div className='flex flex-col gap-4'>
            <TextHeading className='text-xl'>$598.38</TextHeading>
            <Paragraph className='text-sm'>{t('Total Fees')}</Paragraph>
          </div>
        </Box>
        <Box className='flex flex-col gap-4'>
          <TextHeading className='text-xl'>123</TextHeading>
          <Paragraph className='text-sm'>{t('Number of participants')}</Paragraph>
        </Box>
        <Box className='flex flex-col gap-4'>
          <TextHeading className='text-xl'>123</TextHeading>
          <Paragraph className='text-sm'>{t('Amount Of Trades')}</Paragraph>
        </Box>
      </div>
    </>
  )
}

export default AnalyticPage
