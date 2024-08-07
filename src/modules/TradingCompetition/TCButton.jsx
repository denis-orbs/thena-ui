import { useConnectModal } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import DepositModal from '@/app/arena/trading-competitions/[id]/trade/DepositModal'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TC_MARKET_TYPES } from '@/constant'
import { alphaThenaTradeTcLink } from '@/constant/env'
import { useClaimRewardTCPerp, useTCPerpetualInfor, useWithdrawToTCPerp } from '@/hooks/useTcPerpetualContract'
import { useClaimTC, useTCContractInfor, useWithdrawDepositTC } from '@/hooks/useTcSpotContract'
import useWallet from '@/hooks/useWallet'
import dayjs from '@/lib/arenaDayjs'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { isInvalidAmount } from '@/lib/utils'

import DeallocateModal from './DeallocateModal'
import { JoinModal } from './JoinModal'

export function TCButton({ eventType, competition, timestamp }) {
  const tcId = useMemo(() => competition?.id?.split('-')?.[1], [competition?.id])

  const t = useTranslations()
  const { openConnectModal } = useConnectModal()
  const { account } = useWallet()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const { claimReward } = useClaimTC()
  const { claimReward: claimRewardPerp, pending: pendingClaimPerp } = useClaimRewardTCPerp()

  const { withdrawDeposit } = useWithdrawDepositTC()
  const { withdrawTCPerp } = useWithdrawToTCPerp()
  const [showModalDeposit, setShowModalDeposit] = useState(false)
  const [showModalDeallocate, setShowModalDeallocate] = useState(false)
  const [enabledWithdraw, setEnabledWithdraw] = useState(undefined)
  const [remainingTime, setRemainingTime] = useState(undefined)

  const intervalId = useRef(undefined)

  const isTcSpot = useMemo(() => competition?.market === TC_MARKET_TYPES.SPOT, [competition?.market])

  const {
    isRegistered: isJoined,
    isHostClaimable,
    isClaimable,
    isWithdrawable: canWithdraw,
    checkClaimable,
    checkWithdrawable,
  } = useTCContractInfor(competition.tcAddress, eventType, competition.participantCount, competition.market)

  const {
    isRegistered: isJoinedPerp,
    isWithdrawable: canWithdrawPerp,
    checkWithdrawableTCPerp,
    balance,
    withdrawCooldown,
    getWithdrawCooldown,
    isClaimable: isClaimablePerp,
    checkClaimable: checkClaimablePerp,
  } = useTCPerpetualInfor(competition.tcAddress, competition.market, eventType)

  const [joinButtonText, setJoinButtonText] = useState({
    text: null,
    disabled: false,
  })

  const claim = useCallback(async () => {
    try {
      if (competition.market === TC_MARKET_TYPES.SPOT) {
        await claimReward({
          tcAddress: competition.tcAddress,
          isClaimOwnerFee: isHostClaimable,
        })
        await checkClaimable(true)
      } else {
        await claimRewardPerp({ tcId })
        checkClaimablePerp()
      }
    } catch (e) {
      console.error(e)
    }
  }, [
    competition.market,
    competition.tcAddress,
    claimReward,
    isHostClaimable,
    checkClaimable,
    claimRewardPerp,
    tcId,
    checkClaimablePerp,
  ])

  const withdraw = useCallback(async () => {
    try {
      if (competition.market === TC_MARKET_TYPES.SPOT) {
        const isSuccess = await withdrawDeposit({
          tcAddress: competition.tcAddress,
        })
        if (isSuccess) await checkWithdrawable(true)
      } else {
        if (withdrawCooldown === 0 || !enabledWithdraw) {
          setShowModalDeallocate(true)
          return
        }
        setShowModalDeallocate(false)
        const isSuccess = await withdrawTCPerp({
          tcAddress: competition.tcAddress,
          amount: balance,
        })
        if (isSuccess) await checkWithdrawableTCPerp()
      }
    } catch (e) {
      console.error(e)
    }
  }, [
    competition.market,
    competition.tcAddress,
    withdrawDeposit,
    checkWithdrawable,
    withdrawCooldown,
    enabledWithdraw,
    withdrawTCPerp,
    balance,
    checkWithdrawableTCPerp,
  ])

  const autoWithdrawTcPerp = useCallback(async () => {
    if (showModalDeallocate && enabledWithdraw) {
      setShowModalDeallocate(false)
      const isSuccess = await withdrawTCPerp({
        tcAddress: competition?.tcAddress,
        amount: balance,
      })
      if (isSuccess) await checkWithdrawableTCPerp()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, competition?.tcAddress, enabledWithdraw, showModalDeallocate])

  useEffect(() => {
    function intervalCallback() {
      if (competition.market !== TC_MARKET_TYPES.PERPETUAL) return

      if (withdrawCooldown === 0) {
        setEnabledWithdraw(undefined)
        setRemainingTime(undefined)
        clearInterval(intervalId.current)
        return
      }

      const currentTimestamp = Math.floor(Date.now() / 1000)
      const totalCooldown = Number(withdrawCooldown) + Number(12 * 60 * 60)
      if (totalCooldown - currentTimestamp > 0) {
        setRemainingTime(totalCooldown)
        setEnabledWithdraw(false)
      } else {
        setRemainingTime(0)
        setEnabledWithdraw(true)
        clearInterval(intervalId.current)
      }
    }

    intervalCallback()

    intervalId.current = setInterval(intervalCallback, 1000)

    return () => clearInterval(intervalId.current)
  }, [competition.market, withdrawCooldown])

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

  useEffect(() => {
    autoWithdrawTcPerp()
  }, [autoWithdrawTcPerp])

  return (
    <div className='flex w-full items-center justify-between gap-4'>
      <Link href={`/arena/trading-competitions/${competition.id}`} className='w-full'>
        <EmphasisButton className='w-full'>{t('View')}</EmphasisButton>
      </Link>

      {(isTcSpot ? isJoined : isJoinedPerp) && eventType === EVENT_TYPES.LIVE && (
        <Link
          href={
            !isTcSpot
              ? `${alphaThenaTradeTcLink}/${competition.tcAddress}`
              : `/arena/trading-competitions/${competition.id}/trade`
          }
          className='w-full'
          target={isTcSpot ? '_self' : '_blank'}
        >
          <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>
        </Link>
      )}
      {eventType === EVENT_TYPES.ENDED &&
        (isClaimable || isClaimablePerp || isHostClaimable ? (
          <PrimaryButton
            className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600'
            disabled={pendingClaimPerp}
            onClick={claim}
          >
            {isHostClaimable ? t('Claim Owner Fee') : t('Claim Rewards')}
          </PrimaryButton>
        ) : (
          (canWithdraw || canWithdrawPerp) && (
            <PrimaryButton className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600' onClick={withdraw}>
              {t('Withdraw Deposit')}
            </PrimaryButton>
          )
        ))}
      {eventType === EVENT_TYPES.UPCOMING && !isJoined && !isJoinedPerp && joinButtonText.text && (
        <PrimaryButton
          className='w-full text-wrap'
          onClick={() => {
            if (!account) {
              openConnectModal()
            } else {
              setShowJoinModal(true)
            }
          }}
          disabled={joinButtonText.disabled}
        >
          {joinButtonText.text}
        </PrimaryButton>
      )}
      {(isTcSpot
        ? isJoined &&
          Date.now() / 1000 < competition.timestamp?.registrationEnd &&
          isInvalidAmount(competition.competitionRules?.startingBalance)
        : isJoinedPerp && eventType === EVENT_TYPES.UPCOMING) && (
        <PrimaryButton
          className='w-full'
          onClick={() => {
            setShowModalDeposit(true)
          }}
        >
          {t(!isTcSpot ? 'Deposit And Allocate' : 'Deposit')}
        </PrimaryButton>
      )}

      {showJoinModal && (
        <JoinModal competition={competition} onClose={() => setShowJoinModal(false)} open={showJoinModal} />
      )}
      {showModalDeposit && (
        <DepositModal
          competition={competition}
          isOpen={showModalDeposit}
          closeModal={() => setShowModalDeposit(false)}
        />
      )}
      {showModalDeallocate && (
        <DeallocateModal
          open={showModalDeallocate}
          remainingTime={remainingTime}
          balance={balance}
          onClose={() => {
            setShowModalDeallocate(false)
          }}
          tcAddress={competition.tcAddress}
          getWithdrawCooldown={getWithdrawCooldown}
          enabledWithdraw={enabledWithdraw}
        />
      )}
    </div>
  )
}
