'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import { NewTextSubHeading, TextHeading } from '@/components/typography'
import { THENACOLORS } from '@/constant'
import { cn } from '@/lib/utils'

import PieChart from './PieChart'

export default function TotalAllocated({ tokensAndWeights }) {
  const tokens = useMemo(
    () => tokensAndWeights.map(token => ({ ...token.token, weight: token.weight, amount: token.amount })),
    [tokensAndWeights],
  )

  const t = useTranslations()
  return (
    <div className='flex flex-col gap-2'>
      <NewTextSubHeading>{t('Total Allocated')}</NewTextSubHeading>
      <Box>
        <PieChart
          tokens={tokensAndWeights.map(token => ({
            ...token.token,
            weight: token.weight,
            amount: token.amount || 0,
          }))}
        />
        <div className={cn('mx-auto flex w-fit gap-6', tokens.length > 4 && 'grid grid-cols-4')}>
          {tokens.map((item, idx) => (
            <div key={`${item?.data?.address}_${idx}`} className='flex flex-row items-center gap-[6px]'>
              <div className='h-3 w-3 rounded-full' style={{ backgroundColor: THENACOLORS[idx] }} />
              <TextHeading>{item?.symbol}</TextHeading>
            </div>
          ))}
        </div>
      </Box>
    </div>
  )
}
