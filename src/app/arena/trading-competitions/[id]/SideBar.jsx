'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { TextHeading } from '@/components/typography'
import { useUserInfo } from '@/context/userInfoContext'
import { useTCPerpetualInfor } from '@/hooks/useTcPerpetualContract'
import { useClaimTC, useTCContractInfor, useWithdrawDepositTC } from '@/hooks/useTcSpotContract'
import { successToast } from '@/lib/notify'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { Countdown } from '@/modules/CountDown'
import { JoinModal } from '@/modules/TradingCompetition/JoinModal'
import { CheckIcon, PublicIcon } from '@/svgs'

function Sidebar({ competition, eventType }) {
  const t = useTranslations()
  const progressBarRef = useRef()
  const { claimReward } = useClaimTC()
  const [showJoinModal, setShowJoinModal] = useState(false)
  // const [showModalDeposit, setShowModalDeposit] = useState(false)
  const { open } = useWeb3Modal()
  const { account } = useWallet()
  const { withdrawDeposit } = useWithdrawDepositTC()

  const isFull = useMemo(
    () => competition.participantCount === competition.maxParticipants,
    [competition.maxParticipants, competition.participantCount],
  )
  const {
    isRegistered: isJoined,
    isOwner: isHosting,
    isClaimable: canClaimRewards,
    refetch,
    isWithdrawable: canWithdraw,
    checkClaimable,
    checkWithdrawable,
  } = useTCContractInfor(competition.tradingCompetitionSpot, eventType, competition.prize?.weights?.length)
  const { isOwner: isHostingPerp, isRegistered: isJoinedPerp } = useTCPerpetualInfor(competition.tradingCompetitionSpot)
  const [isNotStartRegistration, setIsNotStartRegistration] = useState(false)
  const [isEndedRegistration, setIsEndedRegistration] = useState(false)
  const [copied, setCopied] = useState(false)

  const isTCJoined = useMemo(() => isJoined || isJoinedPerp, [isJoined, isJoinedPerp])

  const isTCHosting = useMemo(() => isHosting || isHostingPerp, [isHosting, isHostingPerp])

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
            totalPrize: formatAmount(fromWei(competition.prize?.totalPrize, competition.prize?.token?.decimals)),
            ticker: competition.prize?.token?.symbol,
          })
          break
        case 1:
          subText = t('Thenian Is Competing', {
            totalPrize: formatAmount(fromWei(competition.prize?.totalPrize, competition.prize?.token?.decimals)),
            ticker: competition.prize?.token?.symbol,
            participantCount: competition.participantCount,
          })
          break
        default:
          subText = t('Thenians Are Competing', {
            totalPrize: formatAmount(fromWei(competition.prize?.totalPrize, competition.prize?.token?.decimals)),
            ticker: competition.prize?.token?.symbol,
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

      if (isJoined && canClaimRewards) {
        text = t('Claim Your Rewards')
        subText = t('You Have Won')
      } else {
        switch (competition.participantCount) {
          case 0:
            subText = t('No Thenians Have Competed', {
              totalPrize: formatAmount(fromWei(competition.prize?.totalPrize, competition.prize?.token?.decimals)),
              ticker: competition.prize?.token?.symbol,
            })
            break
          case 1:
            subText = t('Thenian Has Competed', {
              totalPrize: formatAmount(fromWei(competition.prize?.totalPrize, competition.prize?.token?.decimals)),
              ticker: competition.prize?.token?.symbol,
              participantCount: competition.participantCount,
            })
            break
          default:
            subText = t('Thenians Have Competed', {
              totalPrize: formatAmount(fromWei(competition.prize?.totalPrize, competition.prize?.token?.decimals)),
              ticker: competition.prize?.token?.symbol,
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
    competition.prize?.totalPrize,
    competition.prize?.token?.decimals,
    competition.prize?.token?.symbol,
    isJoined,
    canClaimRewards,
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
      await claimReward({ tcAddress: competition.tradingCompetitionSpot, isOwner: isHosting })
      checkClaimable(true)
    } catch (e) {
      console.error(e)
    }
  }, [claimReward, competition.tradingCompetitionSpot, isHosting, checkClaimable])

  const withdraw = useCallback(async () => {
    try {
      await withdrawDeposit({
        tcAddress: competition.tradingCompetitionSpot,
      })
      await checkWithdrawable(true)
    } catch (e) {
      console.error(e)
    }
  }, [withdrawDeposit, competition.tradingCompetitionSpot, checkWithdrawable])

  const buttonByStatus = useMemo(() => {
    // Ended -> Claim rewards/fee
    if (eventType === EVENT_TYPES.ENDED) {
      if (canClaimRewards) {
        return (
          <PrimaryButton className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600' onClick={claim}>
            {isTCHosting ? t('Claim Owner Fee') : t('Claim Rewards')}
          </PrimaryButton>
        )
      }

      if (canWithdraw) {
        return (
          <PrimaryButton className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600' onClick={withdraw}>
            {t('Withdraw Deposit')}
          </PrimaryButton>
        )
      }
    }

    // For TC host: Share
    if (isTCHosting) {
      return (
        <PrimaryButton className='w-full' onClick={onShare}>
          {t('Share')}
        </PrimaryButton>
      )
    }

    // For participants
    if (eventType === EVENT_TYPES.LIVE && isTCJoined) {
      return (
        <Link href={`/arena/trading-competitions/${competition.id}/trade`}>
          <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>
        </Link>
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
        return (
          <></>
          // <PrimaryButton
          //   className='w-full'
          //   onClick={() => {
          //     setShowModalDeposit(true)
          //   }}
          // >
          //   {t('Deposit More')} {competition?.competitionRules?.tradingTokens?.label}
          // </PrimaryButton>
        )
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
    account,
    canClaimRewards,
    canWithdraw,
    claim,
    competition.id,
    eventType,
    isEndedRegistration,
    isFull,
    isNotStartRegistration,
    isTCHosting,
    isTCJoined,
    onShare,
    open,
    t,
    withdraw,
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
      </Box>
      {showJoinModal && (
        <JoinModal
          competition={competition}
          onClose={() => {
            setShowJoinModal(false)
            refetch()
          }}
          open={showJoinModal}
        />
      )}
      {/* {showModalDeposit && (
        <DepositModal
          competition={competition}
          isOpen={showModalDeposit}
          closeModal={() => setShowModalDeposit(false)}
        />
      )} */}
    </div>
  )
}

export default Sidebar
