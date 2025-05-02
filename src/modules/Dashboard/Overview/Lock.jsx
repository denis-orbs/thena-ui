import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import Skeleton from '@/components/skeleton'
import { NewTextHeading, Paragraph, TextSubHeading } from '@/components/typography'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { formatAmount, ZERO_VALUE } from '@/lib/utils'

import VotingPowerChart from '../Chart/VotingPowerChart'

function Lock() {
  const t = useTranslations()
  const { push } = useRouter()
  const { veTHEs, isLoading } = useVeTHEsContext()

  const totalLock = useMemo(() => veTHEs.reduce((sum, veTHE) => sum.plus(veTHE.amount), ZERO_VALUE), [veTHEs])

  const totalVotingPower = useMemo(
    () => veTHEs.reduce((sum, veTHE) => sum.plus(veTHE.voting_amount), ZERO_VALUE),
    [veTHEs],
  )

  return (
    <Box className='flex h-full flex-col gap-2 !p-4'>
      <div className='flex flex-col'>
        <NewTextHeading className='text-xl !leading-6 md:text-xl'>{t('Lock')}</NewTextHeading>
        {isLoading ? (
          <Skeleton className='h-5 w-[112px]' />
        ) : (
          <Paragraph className='text-neutral-500 lg:text-sm'>
            {t('[value] veTHE in wallet', { value: veTHEs.length })}
          </Paragraph>
        )}
      </div>

      <div className='flex h-full flex-col justify-between gap-2'>
        <div className='h-full w-full gap-2 md:max-h-[224px]'>
          <div className='mx-auto flex h-fit w-full max-w-[352px]'>
            {isLoading ? <Skeleton className='h-full w-full' /> : <VotingPowerChart data={veTHEs} />}
          </div>
          <div className='w-full text-center'>
            <TextSubHeading className='text-sm'>{`${t('Max Lock Power')} ${formatAmount(totalLock)}`}</TextSubHeading>
          </div>
        </div>

        <div className='flex w-full flex-col gap-4'>
          <div className='flex flex-col items-center justify-center'>
            <Paragraph className='text-neutral-500 lg:text-sm'>{t('Total Available Voting Power')}</Paragraph>
            <NewTextHeading className='text-primary-300 md:text-3xl'>
              {formatAmount(totalVotingPower, true)}
            </NewTextHeading>
          </div>
          <EmphasisButton className='w-full max-md:h-8 max-md:text-xs' onClick={() => push('/dashboard/lock')}>
            {t('Manage')}
          </EmphasisButton>
        </div>
      </div>
    </Box>
  )
}

export default Lock
