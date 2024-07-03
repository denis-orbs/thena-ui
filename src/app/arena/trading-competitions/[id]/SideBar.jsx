'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import CustomTooltip from '@/components/tooltip'
import { TextHeading } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant'
import { alphaThenaTradeTcLink } from '@/constant/env'
import { useUserInfo } from '@/context/userInfoContext'
import { useClaimRewardTCPerp, useTCPerpetualInfor, useWithdrawToTCPerp } from '@/hooks/useTcPerpetualContract'
import { useClaimTC, useTCContractInfor, useWithdrawDepositTC } from '@/hooks/useTcSpotContract'
import { successToast } from '@/lib/notify'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { Countdown } from '@/modules/CountDown'
import DeallocateModal from '@/modules/TradingCompetition/DeallocateModal'
import { JoinModal } from '@/modules/TradingCompetition/JoinModal'
import { CheckIcon, PublicIcon } from '@/svgs'

import IncreasePrizeModal from './IncreasePrizeModal'
import DepositModal from './trade/DepositModal'

function Sidebar({ competition, eventType }) {
  const tcId = useMemo(() => competition?.id?.split('-')?.[1], [competition?.id])

  const t = useTranslations()
  const progressBarRef = useRef()
  const { claimReward } = useClaimTC()
  const { claimReward: claimRewardPerp, pending: pendingClaimPerp } = useClaimRewardTCPerp()

  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showIncreasePrize, setShowIncreasePrize] = useState(false)
  const [showModalDeposit, setShowModalDeposit] = useState(false)
  const [showModalDeallocate, setShowModalDeallocate] = useState(false)
  const [enabledWithdraw, setEnabledWithdraw] = useState(undefined)
  const [remainingTime, setRemainingTime] = useState(undefined)

  const intervalId = useRef(undefined)

  const { open } = useWeb3Modal()
  const { account } = useWallet()
  const { withdrawDeposit } = useWithdrawDepositTC()
  const { withdrawTCPerp } = useWithdrawToTCPerp()

  const isFull = useMemo(
    () => competition.participantCount === competition.maxParticipants,
    [competition.maxParticipants, competition.participantCount],
  )

  const {
    isRegistered: isJoined,
    isOwner: isHosting,
    isClaimable,
    isHostClaimable,
    refetch,
    isWithdrawable: canWithdraw,
    checkClaimable,
    checkWithdrawable,
  } = useTCContractInfor(competition.tcAddress, eventType, competition.participantCount, competition.market)

  const {
    isOwner: isHostingPerp,
    isRegistered: isJoinedPerp,
    refetch: refecthPerp,
    isWithdrawable: canWithdrawPerp,
    checkWithdrawableTCPerp,
    balance,
    withdrawCooldown,
    getWithdrawCooldown,
    isClaimable: isClaimablePerp,
    checkClaimable: checkClaimablePerp,
  } = useTCPerpetualInfor(competition.tcAddress, competition.market, eventType)

  const [isNotStartRegistration, setIsNotStartRegistration] = useState(false)
  const [isEndedRegistration, setIsEndedRegistration] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isTCJoined = useMemo(
    () => (competition.market === TC_MARKET_TYPES.SPOT ? isJoined : isJoinedPerp),
    [isJoined, isJoinedPerp, competition.market],
  )

  const isTCHosting = useMemo(
    () => (competition.market === TC_MARKET_TYPES.SPOT ? isHosting : isHostingPerp),
    [isHosting, isHostingPerp, competition.market],
  )

  const headingAndText = useMemo(() => {
    if (!eventType) {
      return {
        heading: null,
        text: null,
        subText: null,
      }
    }

    if (isNotStartRegistration) {
      return {
        heading: t('Registrations open in'),
        text: isTCJoined ? t('Competition Joined') : null,
        subText: isTCJoined ? t('You Joined This Competition') : null,
      }
    }
    if (!isNotStartRegistration && !isEndedRegistration) {
      return {
        heading: t('Registration Ends Soon'),
        text: isTCJoined ? t('Competition Joined') : null,
        subText: isTCJoined ? t('You Joined This Competition') : null,
      }
    }
    if (eventType === EVENT_TYPES.UPCOMING && isEndedRegistration) {
      return {
        heading: t('Trading Starts In'),
        text: null,
        subText: null,
      }
    }
    if (eventType === EVENT_TYPES.LIVE) {
      let subText = null
      switch (competition.participantCount) {
        case 0:
          subText = t('No Thenians Are Competing', {
            totalPrize: competition.prizeUpdate.token
              .map(
                (prize, index) =>
                  `${formatAmount(fromWei(competition.prizeUpdate?.totalPrize?.[index], prize?.token?.decimals))} ${
                    prize?.symbol
                  }`,
              )
              .join(', '),
          })
          break
        case 1:
          subText = t('Thenian Is Competing', {
            totalPrize: competition.prizeUpdate.token
              .map(
                (prize, index) =>
                  `${formatAmount(fromWei(competition.prizeUpdate?.totalPrize?.[index], prize?.token?.decimals))} ${
                    prize?.symbol
                  }`,
              )
              .join(', '),

            participantCount: competition.participantCount,
          })
          break
        default:
          subText = t('Thenians Are Competing', {
            totalPrize: competition.prizeUpdate.token
              .map(
                (prize, index) =>
                  `${formatAmount(fromWei(competition.prizeUpdate?.totalPrize?.[index], prize?.token?.decimals))} ${
                    prize?.symbol
                  }`,
              )
              .join(', '),
            participantCount: competition.participantCount,
          })
          break
      }
      return {
        heading: t('Live'),
        text: t('Competition Has Started'),
        subText,
      }
    }
    if (eventType === EVENT_TYPES.ENDED) {
      let subText = null
      let text = null

      if (isJoined && (isClaimable || isClaimablePerp)) {
        text = t('Claim Your Rewards')
        subText = t('You Have Won')
      } else {
        switch (competition.participantCount) {
          case 0:
            subText = t('No Thenians Have Competed', {
              totalPrize: competition.prizeUpdate.token
                .map(
                  (prize, index) =>
                    `${formatAmount(fromWei(competition.prizeUpdate?.totalPrize?.[index], prize?.token?.decimals))} ${
                      prize?.symbol
                    }`,
                )
                .join(', '),
            })
            break
          case 1:
            subText = t('Thenian Has Competed', {
              totalPrize: competition.prizeUpdate.token
                .map(
                  (prize, index) =>
                    `${formatAmount(fromWei(competition.prizeUpdate?.totalPrize?.[index], prize?.token?.decimals))} ${
                      prize?.symbol
                    }`,
                )
                .join(', '),
              participantCount: competition.participantCount,
            })
            break
          default:
            subText = t('Thenians Have Competed', {
              totalPrize: competition.prizeUpdate.token
                .map(
                  (prize, index) =>
                    `${formatAmount(fromWei(competition.prizeUpdate?.totalPrize?.[index], prize?.token?.decimals))} ${
                      prize?.symbol
                    }`,
                )
                .join(', '),
              participantCount: competition.participantCount,
            })
            break
        }
      }

      return {
        heading: t('Ended'),
        text,
        subText,
      }
    }

    return {
      heading: null,
      text: null,
      subText: null,
    }
  }, [
    eventType,
    isNotStartRegistration,
    isEndedRegistration,
    t,
    isTCJoined,
    competition.participantCount,
    competition.prizeUpdate?.token,
    competition.prizeUpdate?.totalPrize,
    isJoined,
    isClaimable,
    isClaimablePerp,
  ])

  const shareIconButton = useMemo(() => (copied ? CheckIcon : PublicIcon), [copied])
  const { userInfo } = useUserInfo()
  const onShareTC = useCallback(async () => {
    let link = window.location.href
    const urlLink = new URL(link)
    urlLink.searchParams.set('r', userInfo?.username ?? userInfo?.id)
    link = urlLink.toString()
    navigator.clipboard.writeText(link)
    setCopied(true)
    successToast(t('Link Has Been Copied'))
  }, [t, userInfo?.id, userInfo?.username])

  const onShare = useCallback(() => {
    let hostOwnerRef = ''
    if (competition?.owner) {
      hostOwnerRef = competition.owner?.username ? competition.owner?.username : competition.owner?.id
    }
    let link = window.location.href
    if (hostOwnerRef) {
      const urlLink = new URL(link)
      urlLink.searchParams.set('r', hostOwnerRef)
      link = urlLink.toString()
    }
    navigator.clipboard.writeText(link)
    successToast(t('Link Has Been Copied'))
  }, [t, competition?.owner])

  const claim = useCallback(async () => {
    try {
      if (competition.market === TC_MARKET_TYPES.SPOT) {
        await claimReward({ tcAddress: competition.tcAddress, isClaimOwnerFee: isHostClaimable })
        checkClaimable(true)
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
        await withdrawDeposit({
          tcAddress: competition.tcAddress,
        })
        await checkWithdrawable(true)
      } else {
        if (withdrawCooldown === 0 || !enabledWithdraw) {
          setShowModalDeallocate(true)
          return
        }
        setShowModalDeallocate(false)
        await withdrawTCPerp({
          tcAddress: competition.tcAddress,
          amount: balance,
        })
        await checkWithdrawableTCPerp()
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

  const buttonByStatus = useMemo(() => {
    // Ended -> Claim rewards/fee
    if (eventType === EVENT_TYPES.ENDED) {
      if (isClaimable || isClaimablePerp || isHostClaimable) {
        return (
          <PrimaryButton
            className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600'
            disabled={pendingClaimPerp}
            onClick={claim}
          >
            {isHostClaimable ? t('Claim Owner Fee') : t('Claim Rewards')}
          </PrimaryButton>
        )
      }

      if (canWithdraw || canWithdrawPerp) {
        return (
          <PrimaryButton className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600' onClick={withdraw}>
            {t('Withdraw Deposit')}
          </PrimaryButton>
        )
      }
    }

    // For participants
    if (eventType === EVENT_TYPES.LIVE && isTCJoined) {
      return (
        <>
          <Link
            href={
              competition.market === TC_MARKET_TYPES.PERPETUAL
                ? `${alphaThenaTradeTcLink}/${competition.tcAddress}`
                : `/arena/trading-competitions/${competition.id}/trade`
            }
          >
            <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>
          </Link>
          {competition.market === TC_MARKET_TYPES.PERPETUAL &&
            (!competition.competitionRules?.startingBalance ||
              isInvalidAmount(competition.competitionRules?.startingBalance)) && (
              <PrimaryButton
                className='w-full'
                onClick={() => {
                  setShowModalDeposit(true)
                }}
              >
                {t('Deposit And Allocate')}
              </PrimaryButton>
            )}
        </>
      )
    }

    if (eventType === EVENT_TYPES.UPCOMING) {
      if (isNotStartRegistration) {
        return (
          <PrimaryButton className='w-full' disabled>
            {t('Registration Not Yet Open')}
          </PrimaryButton>
        )
      }

      if (isTCJoined) {
        if (
          (competition.market === TC_MARKET_TYPES.PERPETUAL && !competition.competitionRules?.startingBalance) ||
          isInvalidAmount(competition.competitionRules?.startingBalance)
        ) {
          return (
            <PrimaryButton
              className='w-full'
              onClick={() => {
                setShowModalDeposit(true)
              }}
            >
              {t(competition.market === TC_MARKET_TYPES.PERPETUAL ? 'Deposit And Allocate' : 'Deposit')}
            </PrimaryButton>
          )
        }
        return <></>
      }

      if (isEndedRegistration) {
        return (
          <PrimaryButton className='w-full' disabled>
            {t('Registration Ended')}
          </PrimaryButton>
        )
      }

      return (
        <PrimaryButton
          className='w-full'
          disabled={isFull}
          onClick={() => {
            if (!account) {
              open()
            } else {
              setShowJoinModal(true)
            }
          }}
        >
          {isFull ? t('This Competition Is Full') : t('Join Now')}
        </PrimaryButton>
      )
    }

    if (!isTCJoined && eventType === EVENT_TYPES.ENDED) {
      return (
        <SecondaryButton className='w-full' disabled>
          {t('Trading Competition Has Ended')}
        </SecondaryButton>
      )
    }
  }, [
    eventType,
    isTCJoined,
    isClaimable,
    isClaimablePerp,
    isHostClaimable,
    canWithdraw,
    canWithdrawPerp,
    pendingClaimPerp,
    claim,
    t,
    withdraw,
    competition.market,
    competition.tcAddress,
    competition.id,
    competition.competitionRules?.startingBalance,
    isNotStartRegistration,
    isEndedRegistration,
    isFull,
    account,
    open,
  ])

  useEffect(() => {
    const progress = progressBarRef.current
    if (progress) {
      progress.style.width =
        !isTCJoined && eventType === EVENT_TYPES.ENDED
          ? '100%'
          : `${(competition.participantCount / competition.maxParticipants) * 100}%`
    }
  }, [competition.participantCount, competition.maxParticipants, isTCJoined, eventType])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsNotStartRegistration(Date.now() / 1000 <= competition.timestamp.registrationStart)
      setIsEndedRegistration(Date.now() / 1000 > competition.timestamp.registrationEnd)
    }, 1000)
    return () => clearInterval(interval)
  }, [competition.timestamp.registrationEnd, competition.timestamp.registrationStart])

  useEffect(() => {
    if (copied) {
      const timeOut = setTimeout(() => setCopied(false), 2000)

      return () => clearTimeout(timeOut)
    }
  }, [copied])

  useEffect(() => {
    const timeOut = setTimeout(() => setMounted(true), 1500)

    return () => clearTimeout(timeOut)
  }, [])

  return (
    <div className='col-span-12 mt-2 lg:sticky lg:top-56 lg:col-span-5 lg:max-h-[500px]'>
      <div className='flex items-center justify-between'>
        <h3 className='mb-5'>{headingAndText.heading}</h3>
        {isTCJoined && account && <EmphasisIconButton Icon={shareIconButton} onClick={onShareTC} />}
      </div>
      <Box className='flex flex-col space-y-5'>
        {(headingAndText.subText || headingAndText.text) && (
          <Box className='flex flex-col space-y-2 border border-primary-800 bg-primary-950'>
            {headingAndText.text && <TextHeading className='text-xl'>{headingAndText.text}</TextHeading>}
            {headingAndText.subText && <TextHeading className='text-base'>{headingAndText.subText}</TextHeading>}
          </Box>
        )}

        <div className='flex flex-col items-center justify-center gap-2'>
          <div className='h-3 w-full rounded-md bg-neutral-500'>
            <div
              ref={progressBarRef}
              className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
            />
          </div>
          <div>{`${competition.participantCount}/${competition.maxParticipants} ${t('Joined')}`}</div>
        </div>
        {eventType && eventType !== EVENT_TYPES.ENDED && (
          <Countdown
            timestamp={
              eventType === EVENT_TYPES.LIVE
                ? competition.timestamp.endTimestamp
                : isNotStartRegistration
                  ? competition.timestamp.registrationStart
                  : competition.timestamp.startTimestamp
            }
          />
        )}
        {buttonByStatus}
        {account && !isEndedRegistration && competition.market === TC_MARKET_TYPES.SPOT && mounted && (
          <>
            <PrimaryButton
              data-tooltip-id='showTooltip'
              disabled={isNotStartRegistration}
              onClick={() => setShowIncreasePrize(true)}
            >
              {t('Increase Prize')}
            </PrimaryButton>
            {isNotStartRegistration && (
              <CustomTooltip
                className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
                id='showTooltip'
                place='bottom'
              >
                {t('You Can Only Increase The Prize During The Registration Period')}
              </CustomTooltip>
            )}
          </>
        )}
        {isTCHosting && eventType !== EVENT_TYPES.ENDED && (
          <PrimaryButton className='w-full' onClick={onShare}>
            {t('Share')}
          </PrimaryButton>
        )}
      </Box>
      {showJoinModal && (
        <JoinModal
          competition={competition}
          onClose={() => {
            setShowJoinModal(false)
            refetch()
            if (competition.market === TC_MARKET_TYPES.PERPETUAL) {
              refecthPerp()
            }
          }}
          open={showJoinModal}
        />
      )}
      {showModalDeposit && (
        <DepositModal
          competition={competition}
          isOpen={showModalDeposit}
          closeModal={() => setShowModalDeposit(false)}
        />
      )}
      {showIncreasePrize && (
        <IncreasePrizeModal
          isOpen={showIncreasePrize}
          competition={competition}
          closeModal={() => setShowIncreasePrize(false)}
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

export default Sidebar
