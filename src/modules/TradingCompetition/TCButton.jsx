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
    const calculate = time => {
      const now = dayjs()

      const inSeconds = Math.abs(now.diff(time, 'second'))
      const inMinutes = Math.abs(now.diff(time, 'minute'))
      const inHours = Math.abs(now.diff(time, 'hour'))
      const inDays = Math.abs(now.diff(time, 'day'))
      const inMonths = Math.abs(now.diff(time, 'month'))
      const inYears = Math.abs(now.diff(time, 'year'))

      if (inMonths >= 12) {
        return `${inYears} ${inYears === 1 ? t('Year') : t('Years')}`
      }

      if (inDays >= 30) {
        return `${inMonths} ${inMonths === 1 ? t('Month') : t('Months')}`
      }

      if (inMonths < 1) {
        let result = ''

        if (inDays) {
          result += `${inDays}d:`
        }

        if (inHours) {
          result += `${inHours - inDays * 24}h:`
        }

        if (inMinutes) {
          result += `${inMinutes - inHours * 60}m:`
        }

        if (inSeconds) {
          result += `${inSeconds - inMinutes * 60}s`
        }

        return result
      }
    }
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
          const countdown = calculate(registerStart)

          return { text: `${t('Registration Open')} ${countdown}`, disabled: true }
        }
        if (now < start && now > registerEnd) {
          const countdown = calculate(start)

          return { text: `${t('Starts In')} ${countdown}`, disabled: true }
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
