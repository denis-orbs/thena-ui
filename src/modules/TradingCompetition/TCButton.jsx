import { useWeb3Modal } from '@web3modal/wagmi/react'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { useClaimTC, useTCContractInfor } from '@/hooks/useTcSpotContract'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import useWallet from '@/lib/wallets/useWallet'

import { JoinModal } from './JoinModal'

export function TCButton({ eventType, competition, timestamp }) {
  const t = useTranslations()
  const { open } = useWeb3Modal()
  const { account } = useWallet()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const { claimReward } = useClaimTC()
  const {
    isRegistered: isJoined,
    isOwner: isHosting,
    isClaimable: canClaimRewards,
    refetch,
  } = useTCContractInfor(competition.tradingCompetitionSpot, eventType)

  const [joinButtonText, setJoinButtonText] = useState({
    text: null,
    disabled: false,
  })

  const claim = useCallback(async () => {
    try {
      await claimReward({
        tcAddress: competition.tradingCompetitionSpot,
        isOwner: isHosting,
      })
      await refetch()
    } catch (e) {
      console.error(e)
    }
  }, [claimReward, competition.tradingCompetitionSpot, isHosting, refetch])

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
      <Link href={`arena/trading-competitions/${competition.id}`} className='w-full'>
        <EmphasisButton className='w-full'>{t('View')}</EmphasisButton>
      </Link>

      {isJoined && eventType === EVENT_TYPES.LIVE && (
        <Link href={`/arena/trading-competitions/${competition.id}/trade`} className='w-full'>
          <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>
        </Link>
      )}
      {eventType === EVENT_TYPES.ENDED && (isJoined || isHosting) && canClaimRewards && (
        <PrimaryButton className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600' onClick={claim}>
          {t('Claim Rewards')}
        </PrimaryButton>
      )}
      {eventType === EVENT_TYPES.UPCOMING && !isJoined && !isHosting && joinButtonText.text && (
        <PrimaryButton
          className='w-full text-wrap'
          onClick={() => {
            if (!account) {
              open()
            } else {
              setShowJoinModal(true)
            }
          }}
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
