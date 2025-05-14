import { useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import Skeleton from '@/components/skeleton'
import { NewTextHeading, Paragraph, TextSubHeading } from '@/components/typography'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useExtendMultipleLock } from '@/hooks/useVeThe'
import { warnToast } from '@/lib/notify'
import { formatAmount, ZERO_VALUE } from '@/lib/utils'

import VotingPowerChart from '../Chart/VotingPowerChart'

const week = 86400 * 7 * 1000
const maxTimeStamp = 86400 * 730 * 1000
const maxTimes = Math.floor((new Date().getTime() + maxTimeStamp) / week) * week
const maxDate = new Date(maxTimes)

function Lock() {
  const t = useTranslations()
  const { push } = useRouter()
  const { veTHEs, isLoading } = useVeTHEsContext()
  const { onExtend, pending: extendPending } = useExtendMultipleLock()

  const [totalExtendVotingPower, setTotalExtendVotingPower] = useState(null)

  const totalLock = useMemo(() => veTHEs.reduce((sum, veTHE) => sum.plus(veTHE.amount), ZERO_VALUE), [veTHEs])

  const totalVotingPower = useMemo(
    () => veTHEs.reduce((sum, veTHE) => sum.plus(veTHE.voting_amount), ZERO_VALUE),
    [veTHEs],
  )

  const sortedVeTHEs = useMemo(() => {
    const result = [...veTHEs].sort((a, b) => b.voting_amount - a.voting_amount)
    return result
  }, [veTHEs])

  const veTHEsToLock = useMemo(() => {
    const results = []
    veTHEs.forEach(veTHE => {
      if (veTHE.expire > 0) {
        const period = veTHE.lockedEnd * 1000 + maxTimeStamp
        const unlockTime = new Date(Math.min(Math.floor(period / week) * week, maxDate))
        if (unlockTime.getTime() / 1000 !== veTHE.lockedEnd) {
          results.push({ id: veTHE.id, unlockTime, amount: veTHE.amount })
        }
      }
    })
    return results.sort((a, b) => Number(a.id) - Number(b.id))
  }, [veTHEs])

  const extendVotingPower = useMemo(() => {
    const totalExtend = veTHEsToLock.reduce(
      (sum, veTHE) => sum.plus(veTHE.amount.times(veTHE.unlockTime.getTime() - new Date().getTime()).div(maxTimeStamp)),
      ZERO_VALUE,
    )
    return totalExtend.minus(totalVotingPower)
  }, [totalVotingPower, veTHEsToLock])

  const handleExtendLock = useCallback(() => {
    if (veTHEsToLock.length === 0) {
      warnToast('Can only increase lock duration')
      return
    }
    onExtend(veTHEsToLock)
  }, [onExtend, veTHEsToLock])

  return (
    veTHEs.length > 0 && (
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
          <div className='h-full w-full gap-2'>
            <div className='mx-auto flex h-fit w-full'>
              {isLoading ? (
                <Skeleton className='h-full w-full' />
              ) : (
                <VotingPowerChart data={sortedVeTHEs} extendVotingPower={totalExtendVotingPower} />
              )}
            </div>
            <div className='w-full text-center'>
              <TextSubHeading className='text-sm'>{`${t('Max Lock Power')} ${formatAmount(totalLock)}`}</TextSubHeading>
            </div>
          </div>

          <div className='flex w-full flex-col gap-4'>
            <div className='flex flex-col items-center justify-center'>
              <Paragraph className='text-neutral-500 lg:text-sm'>{t('Total Voting Power')}</Paragraph>
              <NewTextHeading className='text-primary-300 md:text-3xl'>
                {formatAmount(totalVotingPower, true)}
              </NewTextHeading>
            </div>

            <div className='flex gap-2'>
              <EmphasisButton
                disabled={extendPending}
                className='w-full max-md:h-8 max-md:text-xs'
                onClick={handleExtendLock}
                onMouseOver={() => setTotalExtendVotingPower(extendVotingPower)}
                onMouseLeave={() => setTotalExtendVotingPower(null)}
              >
                {t('Max Lock')}
              </EmphasisButton>
              <EmphasisButton className='w-full max-md:h-8 max-md:text-xs' onClick={() => push('/dashboard/lock')}>
                {t('Manage')}
              </EmphasisButton>
            </div>
          </div>
        </div>
      </Box>
    )
  )
}

export default Lock
