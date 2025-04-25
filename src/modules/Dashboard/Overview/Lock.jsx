import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import Skeleton from '@/components/skeleton'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { formatAmount } from '@/lib/utils'

import VotingPowerChart from '../Chart/VotingPowerChart'

const COLORS = ['#F199EE', '#EA66E5', '#E333DD', '#84007F', '#B000AA']
function Lock() {
  const t = useTranslations()
  const { push } = useRouter()

  const { veTHEs, isLoading } = useVeTHEsContext()
  const totalLock = veTHEs.reduce((sum, veTHE) => sum.plus(veTHE.amount), new BigNumber(0))

  return (
    <Box className='flex h-full flex-col gap-1.5 !py-4'>
      <TextHeading className='font-archia text-xl font-semibold'>{t('Lock')}</TextHeading>
      <div className='flex h-full flex-col justify-between gap-4'>
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
            {veTHEs.slice(0, 5).map((ve, index) => (
              <div className='flex items-center gap-2' key={ve.id}>
                <div className='size-2' style={{ background: COLORS[index] }} />
                <TextHeading>{`veTHE ${ve.id}`}</TextHeading>
              </div>
            ))}
            {veTHEs.length > 5 && (
              <div className='flex items-center gap-2'>
                <div className='size-2' style={{ background: '#FCE6FB' }} />
                <TextHeading>Others</TextHeading>
              </div>
            )}
          </div>
        )}
        <div className='w-full gap-2'>
          <div className='mx-auto flex h-fit w-full max-w-[300px]'>
            {isLoading ? <Skeleton className='h-full w-full' /> : <VotingPowerChart data={veTHEs} />}
          </div>
          <div className='w-full text-center'>
            <TextSubHeading className='text-sm'>{`${t('Max Lock Power')} ${formatAmount(totalLock)}`}</TextSubHeading>
          </div>
        </div>
        <EmphasisButton className='w-full' onClick={() => push('/dashboard/lock')}>
          {t('Manage')}
        </EmphasisButton>
      </div>
    </Box>
  )
}

export default Lock
