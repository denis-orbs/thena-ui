import { useWeb3Modal } from '@web3modal/wagmi/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TC_MARKET_TYPES } from '@/constant'
import { alphaThenaTradeTcLink } from '@/constant/env'
import { useTCPerpetualInfor } from '@/hooks/useTcPerpetualContract'
import { useClaimTC, useTCContractInfor, useWithdrawDepositTC } from '@/hooks/useTcSpotContract'
import dayjs from '@/lib/arenaDayjs'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import useWallet from '@/lib/wallets/useWallet'

import { JoinModal } from './JoinModal'

export function TCButton({ eventType, competition, timestamp }) {
  const t = useTranslations()
  const { open } = useWeb3Modal()
  const { account } = useWallet()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const { claimReward } = useClaimTC()
  const { withdrawDeposit } = useWithdrawDepositTC()
  const {
    isRegistered: isJoined,
    isOwner: isHosting,
    isClaimable: canClaimRewards,
    isWithdrawable: canWithdraw,
    checkClaimable,
    checkWithdrawable,
  } = useTCContractInfor(competition.tcAddress, eventType, competition.participantCount, competition.market)

  const { isOwner: isHostingPerp, isRegistered: isJoinedPerp } = useTCPerpetualInfor(
    competition.tcAddress,
    competition.market,
  )

  const [joinButtonText, setJoinButtonText] = useState({
    text: null,
    disabled: false,
  })

  const claim = useCallback(async () => {
    try {
      await claimReward({
        tcAddress: competition.tcAddress,
        isOwner: isHosting,
      })
      await checkClaimable(true)
    } catch (e) {
      console.error(e)
    }
  }, [claimReward, competition.tcAddress, isHosting, checkClaimable])

  const withdraw = useCallback(async () => {
    try {
      await withdrawDeposit({
        tcAddress: competition.tcAddress,
      })
      await checkWithdrawable(true)
    } catch (e) {
      console.error(e)
    }
  }, [withdrawDeposit, competition.tcAddress, checkWithdrawable])

  useEffect(() => {
    const interval = setInterval(() => {
      setJoinButtonText(() => {
        const now = dayjs()
        const registerStart = dayjs.tz(timestamp.registrationStart * 1000)
        const registerEnd = dayjs.tz(timestamp.registrationEnd * 1000)
        const start = dayjs.tz(timestamp.startTimestamp * 1000)

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
      <Link href={`/arena/trading-competitions/${competition.id}`} className='w-full'>
        <EmphasisButton className='w-full'>{t('View')}</EmphasisButton>
      </Link>

      {(isJoined || isJoinedPerp) && eventType === EVENT_TYPES.LIVE && (
        <Link
          href={
            competition.market === TC_MARKET_TYPES.PERPETUAL
              ? `${alphaThenaTradeTcLink}/${competition.tcAddress}`
              : `/arena/trading-competitions/${competition.id}/trade`
          }
          className='w-full'
        >
          <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>
        </Link>
      )}
      {eventType === EVENT_TYPES.ENDED &&
        ((isJoined || isJoinedPerp || isHosting || isHostingPerp) && canClaimRewards ? (
          <PrimaryButton className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600' onClick={claim}>
            {t('Claim Rewards')}
          </PrimaryButton>
        ) : (
          canWithdraw && (
            <PrimaryButton className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600' onClick={withdraw}>
              {t('Withdraw Deposit')}
            </PrimaryButton>
          )
        ))}
      {eventType === EVENT_TYPES.UPCOMING &&
        !isJoined &&
        !isJoinedPerp &&
        !isHosting && // comment these 2 for testing join as host
        !isHostingPerp && //
        joinButtonText.text && (
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
