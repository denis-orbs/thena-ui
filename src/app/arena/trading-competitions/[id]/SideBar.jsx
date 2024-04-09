'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { useTCContractInfor, useTcSpotContract } from '@/hooks/useTcSpotContract'
import { successToast } from '@/lib/notify'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { Countdown } from '@/modules/CountDown'
import { JoinModal } from '@/modules/TradingCompetition/JoinModal'

function Sidebar({ competition, eventType }) {
  const t = useTranslations()
  const progressBarRef = useRef()
  const { claimPrize } = useTcSpotContract(competition.tradingCompetitionSpot)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const { open } = useWeb3Modal()
  const { account } = useWallet()

  const isFull = useMemo(
    () => competition.participantCount === competition.maxParticipants,
    [competition.maxParticipants, competition.participantCount],
  )
  const {
    isRegistered: isJoined,
    isOwner: isHosting,
    isClaimable: canClaimRewards,
    refetch,
  } = useTCContractInfor(competition.tradingCompetitionSpot, eventType)
  const [isNotStartRegistration, setIsNotStartRegistration] = useState(false)
  const [isEndedRegistration, setIsEndedRegistration] = useState(false)

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
        text: isJoined ? t('Competition Joined') : null,
        subText: isJoined ? t('You Joined This Competition') : null,
      }
    }
    if (!isNotStartRegistration && !isEndedRegistration) {
      return {
        heading: t('Registration Ends Soon'),
        text: isJoined ? t('Competition Joined') : null,
        subText: isJoined ? t('You Joined This Competition') : null,
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
          subText = t('Thenian Are Competing', {
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
    isJoined,
    competition.participantCount,
    competition.prize?.totalPrize,
    competition.prize?.token?.decimals,
    competition.prize?.token?.symbol,
    canClaimRewards,
  ])

  const onShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    successToast(t('Link Has Been Copied'))
  }, [t])

  const claim = useCallback(async () => {
    try {
      await claimPrize()
      refetch()
    } catch (e) {
      console.error(e)
    }
  }, [claimPrize, refetch])

  const buttonByStatus = useMemo(() => {
    if (isHosting) {
      return (
        <PrimaryButton className='w-full' onClick={onShare}>
          {t('Share')}
        </PrimaryButton>
      )
    }

    if (!isHosting && eventType === EVENT_TYPES.LIVE && isJoined) {
      return (
        <Link href={`/arena/trading-competitions/${competition.id}/trade`}>
          <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>
        </Link>
      )
    }

    if (!isHosting && eventType === EVENT_TYPES.UPCOMING && !isJoined) {
      if (isNotStartRegistration) {
        return (
          <PrimaryButton className='w-full' disabled>
            {t('Registration Not Yet Open')}
          </PrimaryButton>
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

    if (!isJoined && eventType === EVENT_TYPES.ENDED) {
      return (
        <SecondaryButton className='w-full' disabled>
          {t('Trading Competition Has Ended')}
        </SecondaryButton>
      )
    }
    if (isJoined && canClaimRewards && eventType === EVENT_TYPES.ENDED) {
      return (
        <PrimaryButton className='bg-green w-full' onClick={claim}>
          {t('Claim Rewards')}
        </PrimaryButton>
      )
    }
  }, [
    account,
    canClaimRewards,
    claim,
    competition.id,
    eventType,
    isEndedRegistration,
    isFull,
    isHosting,
    isJoined,
    isNotStartRegistration,
    onShare,
    open,
    t,
  ])

  useEffect(() => {
    const progress = progressBarRef.current
    if (progress) {
      progress.style.width =
        !isJoined && eventType === EVENT_TYPES.ENDED
          ? '100%'
          : `${(competition.participantCount / competition.maxParticipants) * 100}%`
    }
  }, [competition.participantCount, competition.maxParticipants, isJoined, eventType])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsNotStartRegistration(Date.now() / 1000 <= competition.timestamp.registrationStart)
      setIsEndedRegistration(Date.now() / 1000 > competition.timestamp.registrationEnd)
    }, 1000)
    return () => clearInterval(interval)
  }, [competition.timestamp.registrationEnd, competition.timestamp.registrationStart])

  return (
    <div className='col-span-12 mt-2 lg:sticky lg:top-56 lg:col-span-5 lg:max-h-[500px]'>
      <h3 className='mb-5'>{headingAndText.heading}</h3>
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
                  : competition.timestamp.registrationEnd
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
    </div>
  )
}

export default Sidebar
