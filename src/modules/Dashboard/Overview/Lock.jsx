import { useRouter } from 'next/navigation'
import React from 'react'
import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import Skeleton from '@/components/skeleton'
import { TextHeading } from '@/components/typography'
import { useVeTHEsContext } from '@/context/veTHEsContext'

import MultiGaugeChart from '../Chart/GaugeChart'

function Lock() {
  const t = useTranslations()
  const { push } = useRouter()

  const { veTHEs, isLoading } = useVeTHEsContext()

  return (
    <Box className='flex h-full flex-col gap-1.5'>
      <TextHeading className='font-archia text-xl font-semibold'>{t('Lock')}</TextHeading>
      <div className='flex h-full flex-col justify-between'>
        {isLoading ? (
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2'>
              <div className='size-2 bg-primary-300' />
              <Skeleton className='h-5 w-[88px]' />
            </div>
            <div className='flex items-center gap-2'>
              <div className='size-2 bg-primary-700' />
              <Skeleton className='h-5 w-[88px]' />
            </div>
          </div>
        ) : (
          <div className='flex flex-wrap gap-4'>
            {veTHEs.slice(0, 5).map(ve => (
              <div className='flex items-center gap-2' key={ve.id}>
                <div className='size-2 bg-primary-300' />
                <TextHeading>{`veTHE ${ve.id}`}</TextHeading>
              </div>
            ))}
          </div>
        )}
        <div className='min-h-[200px] w-full'>
          {isLoading ? (
            <Skeleton className='h-full w-full' />
          ) : (
            <MultiGaugeChart
              segments={[
                { value: 100000, max: 170000, color: '#ff66ff' },
                { value: 60000, max: 170000, color: '#9000a0' },
                { value: 50000, max: 170000, color: '#3f003f' },
              ]}
            />
          )}
        </div>
        <EmphasisButton className='w-full' onClick={() => push('/dashboard/lock')}>
          {t('Manage')}
        </EmphasisButton>
      </div>
    </Box>
  )
}

export default Lock
