import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { useTcSpotContractActions } from '@/hooks/useTcSpotContractActions'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'

import { JoinModal } from './JoinModal'

export function TCButton({ eventType, competition, account, timestamp }) {
  const t = useTranslations()
  const { push } = useRouter()
  const [canClaimRewards, setCanClaimRewards] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const { checkUserClaimable, claimPrize } = useTcSpotContractActions(competition.tradingCompetitionSpot)

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

  const [joinButtonText, setJoinButtonText] = useState({
    text: null,
    disabled: false,
  })

  const claim = useCallback(async () => {
    try {
      await claimPrize()
      const canClaim = await checkUserClaimable()
      setCanClaimRewards(canClaim)
    } catch (e) {
      console.error(e)
    }
  }, [checkUserClaimable, claimPrize])

  useEffect(() => {
    async function fetchData() {
      const can = await checkUserClaimable()
      setCanClaimRewards(can)
    }
    fetchData()
  }, [checkUserClaimable])

  useEffect(() => {
    const interval = setInterval(() => {
      setJoinButtonText(() => {
        const now = dayjs()
        const registerStart = dayjs.unix(timestamp.registrationStart)
        const registerEnd = dayjs.unix(timestamp.registrationEnd)
        const start = dayjs.unix(timestamp.startTimestamp)

        if (competition.participantCount === competition.maxParticipants) {
          return { text: t('Competition Full'), disabled: true }
        }

        if (now <= registerStart) {
          return { text: t('Registration Not Yet Open'), disabled: true }
        }
        if (now < start && now > registerEnd) {
          return { text: t('Registration Ended'), disabled: true }
        }
        return { text: t('Join Now'), disabled: false }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [
    competition.maxParticipants,
    competition.participantCount,
    competition.timestamp,
    competition.timestamp.startTimestamp,
    eventType,
    t,
    timestamp,
  ])

  return (
    <div className='flex w-full items-center justify-between gap-4'>
      <EmphasisButton className='w-full' onClick={() => push(`arena/trading-competitions/${competition.id}`)}>
        {t('View')}
      </EmphasisButton>

      {isJoined && eventType === EVENT_TYPES.LIVE && <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>}
      {eventType === EVENT_TYPES.ENDED && (isJoined || isHosting) && canClaimRewards && (
        <PrimaryButton className='w-full' onClick={claim}>
          {t('Claim Rewards')}
        </PrimaryButton>
      )}
      {eventType === EVENT_TYPES.UPCOMING && !isJoined && !isHosting && joinButtonText.text && (
        <PrimaryButton
          className='w-full text-wrap'
          onClick={() => setShowJoinModal(true)}
          disabled={joinButtonText.disabled}
        >
          {joinButtonText.text}
        </PrimaryButton>
      )}

      {showJoinModal && (
        <JoinModal competition={competition} onClose={() => setShowJoinModal(false)} open={showJoinModal} />
      )}
    </div>
  )
}
