import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'

export function TCButton({ eventType, competition, account }) {
  const t = useTranslations()
  const { push } = useRouter()

  const isHosting = useMemo(
    () => account && account.toLowerCase() === competition.owner.id,
    [account, competition.owner.id],
  )

  const isJoined = useMemo(
    () =>
      competition.participants.length && account
        ? competition.participants.find(participant => participant.participant.id === account.toLowerCase())
        : false,
    [account, competition.participants],
  )

  return (
    <div className='flex w-full items-center justify-between gap-4'>
      <EmphasisButton className='w-full' onClick={() => push(`arena/trading-competitions/${competition.id}`)}>
        {t('View')}
      </EmphasisButton>

      {isJoined && eventType === EVENT_TYPES.LIVE && <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>}
      {eventType === EVENT_TYPES.ENDED && (isJoined || isHosting) && (
        <PrimaryButton className='w-full'>{t('Claim Rewards')}</PrimaryButton>
      )}
      {eventType === EVENT_TYPES.UPCOMING && !isJoined && !isHosting && (
        <PrimaryButton className='w-full'>{t('Join Now')}</PrimaryButton>
      )}
    </div>
  )
}
