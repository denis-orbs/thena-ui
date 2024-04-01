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

  const onShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    successToast(t('Link Has Been Copied'))
  }, [t])

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
      <h3 className='mb-5'>{t('Registration')}</h3>
      <Box className='flex flex-col space-y-5'>
        <Box className='flex flex-col space-y-2 border border-primary-800 bg-primary-950'>
          {eventType === EVENT_TYPES.LIVE && !isJoined && (
            <TextHeading className='text-xl'>{t('Competition Has Started')}</TextHeading>
          )}
          {eventType === EVENT_TYPES.ENDED && !isJoined && (
            <>
              <TextHeading className='text-xl'>{t('Ended')}</TextHeading>
              <TextHeading className='text-base'>
                {t('ParticipantCount Has Competed', {
                  participantCount: competition.participantCount,
                  totalPrize: formatAmount(fromWei(competition.prize?.totalPrize, competition.prize?.token?.decimals)),
                  ticker: competition.prize?.token?.symbol,
                })}
              </TextHeading>
            </>
          )}
          {isJoined && (
            <>
              <TextHeading className='text-xl'>
                {eventType === EVENT_TYPES.ENDED ? t('Claim Your Rewards') : t('Competition Joined')}
              </TextHeading>
              <TextHeading className='text-base'>
                {eventType === EVENT_TYPES.ENDED
                  ? t('You Have Won')
                  : t('You Joined This Competition On', { date: 'Nov 13, 2024' })}
              </TextHeading>
            </>
          )}
        </Box>

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
        {isHosting && (
          <PrimaryButton className='w-full' onClick={onShare}>
            {t('Share')}
          </PrimaryButton>
        )}
        {!isHosting && eventType === EVENT_TYPES.LIVE && (
          <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>
        )}
        {!isHosting && isInRegistration && eventType !== EVENT_TYPES.LIVE && (
          <PrimaryButton className='w-full' disabled={isFull}>
            {isFull ? t('This Competition Is Full') : t('Register')}
          </PrimaryButton>
        )}
        {!isJoined && eventType === EVENT_TYPES.ENDED && (
          <SecondaryButton className='w-full' disabled>
            {t('Trading Competition Has Ended')}
          </SecondaryButton>
        )}
        {isJoined && eventType === EVENT_TYPES.ENDED && (
          <PrimaryButton className='bg-green w-full'>{t('Claim Rewards')}</PrimaryButton>
        )}
      </Box>
    </div>
  )
}

export default Sidebar
