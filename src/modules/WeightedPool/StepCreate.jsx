'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

export default function StepCreate({ currentStep }) {
  const t = useTranslations()
  return (
    <Box className='flex flex-col gap-6'>
      <div className='flex flex-row items-center gap-1'>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#34243D] text-[18px] text-neutral-50',
            currentStep === 1 ? 'bg-primary-600' : '',
          )}
        >
          1
        </div>

        <TextHeading>{t('Tokens and Weights')}</TextHeading>
      </div>
      <div className='flex flex-row items-center gap-1'>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#34243D] text-[18px] text-neutral-50',
            currentStep === 2 ? 'bg-primary-600' : '',
          )}
        >
          2
        </div>
        <TextHeading>{t('Pool Fees')}</TextHeading>
      </div>
      <div className='flex flex-row items-center gap-1'>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#34243D] text-[18px] text-neutral-50',
            currentStep === 3 ? 'bg-primary-600' : '',
          )}
        >
          3
        </div>
        <TextHeading>{t('Initial Liquidity')}</TextHeading>
      </div>
      <div className='flex flex-row items-center gap-1'>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#34243D] text-[18px] text-neutral-50',
            currentStep === 4 ? 'bg-primary-600' : '',
          )}
        >
          4
        </div>
        <TextHeading>{t('Confirm')}</TextHeading>
      </div>
    </Box>
  )
}
