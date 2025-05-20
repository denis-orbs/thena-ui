'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import { NewTextSubHeading, TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

import PieChart from './PieChart'

const colorsDefault = ['#F199EE', '#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F', '#580055', '#32002F']
export default function TotalAllocated({ tokensAndWeights }) {
  const tokens = useMemo(
    () => tokensAndWeights.map(token => ({ ...token.token, weight: token.weight, amount: token.amount })),
    [tokensAndWeights],
  )

  const t = useTranslations()
  return (
    <div className='space-y-2'>
      <NewTextSubHeading>{t('Total Allocated')}</NewTextSubHeading>
      <Box>
        <PieChart
          tokens={tokensAndWeights.map(token => ({
            ...token.token,
            weight: token.weight,
            amount: token.amount || 0,
          }))}
          // colors={colors}
        />
        <div className={cn('mx-auto flex w-fit gap-6', tokens.length > 4 && 'grid grid-cols-4')}>
          {tokens.map((item, idx) => (
            <div key={`${item?.data?.address}_${idx}`} className='flex flex-row items-center gap-[6px]'>
              <div className='h-3 w-3 rounded-full' style={{ backgroundColor: colorsDefault[idx] }} />
              <TextHeading>{item?.symbol}</TextHeading>
            </div>
          ))}
        </div>
      </Box>
    </div>
  )
}
