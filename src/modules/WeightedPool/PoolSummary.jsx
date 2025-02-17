'use client'

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

import PieChart from './PieChart'

const colors = ['#32002F', '#84007F', '#B000AA', '#580055', '#DC00D4', '#E333DD', '#EA66E5', '#F199EE']

ChartJS.register(ArcElement, Tooltip, Legend)
export default function PoolSummary({ tokensAndWeights }) {
  const data = useMemo(
    () =>
      tokensAndWeights.length > 0
        ? tokensAndWeights.map((item, index) => ({
            data: item.token,
            value: item.weight,
            color: colors[index % colors.length],
            cutout: '50%',
          }))
        : [
            {
              data: {},
              value: 100,
              color: '#8E8194',
              cutout: '50%',
            },
          ],
    [tokensAndWeights],
  )

  const t = useTranslations()
  return (
    <Box className='flex flex-col space-y-6'>
      <TextHeading className='font-archia text-2xl font-semibold'>{t('Pool Summary')}</TextHeading>
      <PieChart
        tokens={tokensAndWeights.map(token => ({
          ...token.token,
          weight: token.weight,
          amount: token.amount || 0,
        }))}
      />
      {/* ['#32002F', '#580055', '#84007F', '#B000AA', '#DC00D4', '#E333DD', '#EA66E5', '#F199EE'] */}
      <div className='hidden bg-[#EA66E5]' />
      <div className='hidden bg-[#32002F]' />
      <div className='hidden bg-[#84007F]' />
      <div className='hidden bg-[#DC00D4]' />
      <div className='hidden bg-[#580055]' />
      <div className='hidden bg-[#B000AA]' />
      <div className='hidden bg-[#E333DD]' />
      <div className='hidden bg-[#F199EE]' />
      <div className='mx-auto flex justify-between gap-6'>
        {data.map((item, idx) => (
          <div key={`${item?.data?.address}_${idx}`} className='flex flex-row items-center gap-[6px]'>
            <div className={cn('h-3 w-3 rounded-full', `bg-[${item?.color}]`)} />
            <TextHeading>{item?.data?.symbol}</TextHeading>
          </div>
        ))}
      </div>
    </Box>
  )
}
