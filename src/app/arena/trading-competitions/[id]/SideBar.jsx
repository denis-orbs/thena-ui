'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import Box from '@/components/box'
import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { successToast } from '@/lib/notify'
import { EVENT_TYPES, getEventType } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { Countdown } from '@/modules/CountDown'

function Sidebar({ competition }) {
  const t = useTranslations()
  const progressBarRef = useRef()
  const { account } = useWallet()

  const eventType = useMemo(() => getEventType(competition.timestamp), [competition.timestamp])

  const isHosting = useMemo(
    () => account && account.toLowerCase() === competition.owner.id,
    [account, competition.owner.id],
  )

  const isJoined = useMemo(
    () =>
      competition.participants.length && account
        ? competition.participants.find(participant => participant.id === account.toLowerCase())
        : false,
    [account, competition.participants],
  )

  const isFull = useMemo(
    () => competition.participantCount === competition.maxParticipants,
    [competition.maxParticipants, competition.participantCount],
  )

  const isInRegistration = useMemo(
    () => Date.now() / 1000 <= competition.timestamp.registrationEnd,
    [competition.timestamp.registrationEnd],
  )

  const isClaimed = false

  const headingAndText = useMemo(() => {
    if (isInRegistration) {
      return {
        heading: t('Registration'),
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

      if (isJoined && !isClaimed) {
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
  }, [
    competition.participantCount,
    competition.prize?.token?.decimals,
    competition.prize?.token?.symbol,
    competition.prize?.totalPrize,
    eventType,
    isClaimed,
    isInRegistration,
    isJoined,
    t,
  ])

  const onShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    successToast(t('Link Has Been Copied'))
  }, [t])

  const buttonByStatus = useMemo(() => {
    if (isHosting) {
      return (
        <PrimaryButton className='w-full' onClick={onShare}>
          {t('Share')}
        </PrimaryButton>
      )
    }

    if (!isHosting && eventType === EVENT_TYPES.LIVE) {
      return <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>
    }

    if (!isHosting && eventType !== EVENT_TYPES.LIVE && isInRegistration) {
      return (
        <PrimaryButton className='w-full' disabled={isFull}>
          {isFull ? t('This Competition Is Full') : t('Register')}
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
    if (isJoined && eventType === EVENT_TYPES.ENDED) {
      return <PrimaryButton className='bg-green w-full'>{t('Claim Rewards')}</PrimaryButton>
    }
  }, [eventType, isFull, isHosting, isInRegistration, isJoined, onShare, t])

  useEffect(() => {
    const progress = progressBarRef.current
    if (progress) {
      progress.style.width =
        !isJoined && eventType === EVENT_TYPES.ENDED
          ? '100%'
          : `${competition.participantCount / competition.maxParticipants}%`
    }
  }, [competition.participantCount, competition.maxParticipants, isJoined, eventType])

  return (
    <div className='col-span-12 mt-2 lg:col-span-5'>
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
          <div>{t('Spots Left', { spot: `${competition.participantCount}/${competition.maxParticipants}` })}</div>
        </div>
        {eventType !== EVENT_TYPES.ENDED && (
          <Countdown
            timestamp={
              eventType === EVENT_TYPES.LIVE
                ? competition.timestamp.endTimestamp
                : competition.timestamp.registrationEnd
            }
          />
        )}
        {buttonByStatus}
      </Box>
    </div>
  )
}

export default Sidebar
