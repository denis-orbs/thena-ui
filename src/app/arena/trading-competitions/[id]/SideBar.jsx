'use client'

import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useQuery } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { OutlinedButton, PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import CustomTooltip from '@/components/tooltip'
import { TextHeading } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant'
import { alphaThenaTradeTcLink } from '@/constant/env'
import { useUserInfo } from '@/context/userInfoContext'
import { fetchUserRankAndPnLInTC } from '@/hooks/trade/useTradingCompetitionLeaderboard'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { useClaimRewardTCPerp, useTCPerpetualInfor, useWithdrawTCPerps } from '@/hooks/useTcPerpetualContract'
import { useClaimTC, useTCContractInfor, useWithdrawDepositTC } from '@/hooks/useTcSpotContract'
import useWallet from '@/hooks/useWallet'
import { v4Client } from '@/lib/graphql'
import { errorToast, successToast } from '@/lib/notify'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import { Countdown } from '@/modules/Countdown'
import DeallocateModal from '@/modules/TradingCompetition/DeallocateModal'
import { JoinModal } from '@/modules/TradingCompetition/JoinModal'
import { CheckIcon, InfoCirCleDisableIcon, InfoNeutralIcon, PublicIcon } from '@/svgs'

import IncreasePrizeModal from './IncreasePrizeModal'
import DepositModal from './trade/DepositModal'

const V4_DEPOSIT_OF_USER = gql`
  query V4_DEPOSIT_OF_USER($tcId: String!, $userId: String!) {
    tcDeposits(where: { tradingCompetition: { id_eq: $tcId }, user: { id_eq: $userId }, type_eq: "deposit" }) {
      id
      amount
    }
  }
`

const getDepositOfUser = async (tcId, userId) => {
  try {
    if (tcId && userId) {
      const { tcDeposits } = await v4Client.request(V4_DEPOSIT_OF_USER, { tcId, userId })
      if (tcDeposits && tcDeposits.length) {
        const deposit = tcDeposits.reduce((total, item) => Number(total) + Number(item.amount), 0)
        return String(deposit)
      }
      return 0
    }
    return 0
  } catch {
    return 0
  }
}

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

  const { getValueTokenAmountToUSD } = useTokenUSDValue()

  const intervalId = useRef(undefined)

  const { openConnectModal } = useConnectModal()
  const { account } = useWallet()
  const { withdrawDeposit } = useWithdrawDepositTC()
  const { withdrawTCPerp } = useWithdrawTCPerps()

  const isFull = useMemo(
    () => competition.participantCount === Number(competition.maxParticipants),
    [competition.maxParticipants, competition.participantCount],
  )

  const { data: deposit } = useSWR(
    ['deposit of user in tc', competition?.id, account],
    () => getDepositOfUser(competition?.id, account?.toLowerCase()),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
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
    deallocatableBalance,
    withdrawableBalance,
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

  const isBNBSS3TC = useMemo(() => competition.id === '0x1781b0810e89f4d11c25462d7ecb4f6f03109dfe-9', [competition.id])

  const { data: competitionUser } = useQuery({
    queryKey: ['user rank and pnl in TC', competition.id, account?.toLowerCase()],
    queryFn: () => fetchUserRankAndPnLInTC(competition.id, account?.toLowerCase()),
    gcTime: 0,
    enabled: Boolean(competition.id && account && isBNBSS3TC),
  })

  const totalPrizeByToken = useMemo(() => {
    const formatData = (competition?.prizeUpdate?.token || []).map((prize, index) => {
      const amount = fromWei(competition?.prizeUpdate?.totalPrize?.[index], prize?.decimals)
      const symbol = prize?.symbol
      return {
        amount,
        symbol,
      }
    })

    const filterData = formatData.filter(({ amount }) => !isInvalidAmount(amount))

    const finalData = filterData.length > 0 ? filterData : formatData
    return finalData.map(({ amount, symbol }) => `${formatAmount(amount, false, 5, false)} ${symbol}`)
  }, [competition.prizeUpdate?.token, competition?.prizeUpdate?.totalPrize])

  const totalPrizeUsd = useMemo(
    () =>
      (competition?.prizeUpdate?.token || []).reduce((sum, prize, index) => {
        const amount = fromWei(competition.prizeUpdate?.totalPrize?.[index], prize?.decimals)
        return sum + getValueTokenAmountToUSD(prize?.address, amount)
      }, 0),
    [competition?.prizeUpdate?.token, competition?.prizeUpdate?.totalPrize, getValueTokenAmountToUSD],
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
      let endOfSubText = null
      switch (competition.participantCount) {
        case 0:
          subText = t('No Thenians Are Competing')
          endOfSubText = '!'
          break
        case 1:
          subText = t('Thenian Is Competing', {
            participantCount: competition.participantCount,
          })
          endOfSubText = t('Will they beat themselves')
          break
        default:
          subText = t('Thenians Are Competing', {
            participantCount: competition.participantCount,
          })
          endOfSubText = '!'
          break
      }
      return {
        heading: t('Live'),
        text: t('Competition Has Started'),
        subText,
        endOfSubText,
      }
    }
    if (eventType === EVENT_TYPES.ENDED) {
      let subText = null
      let text = null
      let endOfSubText = null

      if (isBNBSS3TC && !isInvalidAmount(competitionUser?.participants?.[0]?.winAmountUSD)) {
        return {
          heading: t('Ended'),
          text: '',
          subText: t('You Have Won Special'),
        }
      }

      if (isJoined && (isClaimable || isClaimablePerp)) {
        text = t('Claim Your Rewards')
        subText = t('You Have Won')
      } else {
        switch (competition.participantCount) {
          case 0:
            subText = t('No Thenians Have Competed')
            endOfSubText = '!'
            break
          case 1:
            subText = t('Thenian Has Competed', {
              participantCount: competition.participantCount,
            })
            endOfSubText = '!'
            break
          default:
            subText = t('Thenians Have Competed', {
              participantCount: competition.participantCount,
            })
            endOfSubText = '!'
            break
        }
      }

      return {
        heading: t('Ended'),
        text,
        subText,
        endOfSubText,
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
    isBNBSS3TC,
    competitionUser?.participants,
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
        const isSuccess = await withdrawDeposit({
          tcAddress: competition.tcAddress,
        })
        if (isSuccess) await checkWithdrawable(true)
      } else {
        // Withdraw or deallocate
        if (withdrawCooldown === 0 || !isInvalidAmount(deallocatableBalance) || !enabledWithdraw) {
          // Deallocate
          setShowModalDeallocate(true)
          return
        }
        // Withdraw
        setShowModalDeallocate(false)
        const isSuccess = await withdrawTCPerp({
          tcAddress: competition.tcAddress,
          amount: withdrawableBalance,
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
    deallocatableBalance,
    enabledWithdraw,
    withdrawTCPerp,
    withdrawableBalance,
    checkWithdrawableTCPerp,
  ])

  const checkDisplayTextDeposit = useMemo(
    () =>
      isTCJoined &&
      (competition.market === TC_MARKET_TYPES.SPOT
        ? eventType === EVENT_TYPES.UPCOMING &&
          isInvalidAmount(competition.competitionRules?.startingBalance) &&
          Date.now() / 1000 < competition.timestamp?.registrationEnd
        : eventType !== EVENT_TYPES.ENDED),
    [
      competition.competitionRules?.startingBalance,
      competition.market,
      competition.timestamp?.registrationEnd,
      eventType,
      isTCJoined,
    ],
  )

  const autoWithdrawTcPerp = useCallback(async () => {
    if (showModalDeallocate && enabledWithdraw) {
      setShowModalDeallocate(false)
      const isSuccess = await withdrawTCPerp({
        tcAddress: competition?.tcAddress,
        amount: withdrawableBalance,
      })
      if (isSuccess) await checkWithdrawableTCPerp()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawableBalance, competition?.tcAddress, enabledWithdraw, showModalDeallocate])

  useEffect(() => {
    function intervalCallback() {
      if (competition.market !== TC_MARKET_TYPES.PERPETUAL) return

      // If can deallocate, dont withdraw
      if (withdrawCooldown === 0 || !isInvalidAmount(deallocatableBalance)) {
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
  }, [competition.market, deallocatableBalance, withdrawCooldown])

  const buttonByStatus = useMemo(() => {
    // Ended -> Claim rewards/fee
    if (eventType === EVENT_TYPES.ENDED) {
      let checkMyTradesButton = null
      if (isJoinedPerp) {
        checkMyTradesButton = (
          <Link href={`${alphaThenaTradeTcLink}/${competition.tcAddress}`} target='_blank'>
            <PrimaryButton className='w-full'>{t('Check my Trades')}</PrimaryButton>
          </Link>
        )
      }

      if (isClaimable || isClaimablePerp || isHostClaimable) {
        return (
          <>
            {checkMyTradesButton}
            <PrimaryButton
              className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600'
              disabled={pendingClaimPerp}
              onClick={claim}
            >
              {isHostClaimable ? t('Claim Owner Fee') : t('Claim Rewards')}
            </PrimaryButton>
          </>
        )
      }

      if (canWithdraw || canWithdrawPerp) {
        return (
          <>
            {checkMyTradesButton}
            <PrimaryButton className='w-full bg-green-900 hover:bg-green-700 active:bg-green-600' onClick={withdraw}>
              {t('Withdraw Deposit')}
            </PrimaryButton>
          </>
        )
      }

      return checkMyTradesButton
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
            target={competition.market === TC_MARKET_TYPES.PERPETUAL ? '_blank' : '_self'}
          >
            <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>
          </Link>
          {competition.market === TC_MARKET_TYPES.PERPETUAL && (
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
          competition.market === TC_MARKET_TYPES.PERPETUAL ||
          (competition.market === TC_MARKET_TYPES.SPOT &&
            isInvalidAmount(competition.competitionRules?.startingBalance) &&
            Date.now() / 1000 < competition.timestamp?.registrationEnd)
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
            if (competition.id.toLowerCase() === '0xcd10f7cc95b1829d78fa5562889410f3e984d27c-5') {
              errorToast(
                'Registrations are stopped for this competition. Please check THENA Discord server for more information.',
                null,
                null,
                false,
                {
                  style: {
                    cursor: 'pointer',
                  },
                  onClick: () => (window.location.href = 'https://discord.gg/thena'),
                },
              )
              return
            }

            if (!account) {
              openConnectModal()
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
    isJoinedPerp,
    isClaimable,
    isClaimablePerp,
    isHostClaimable,
    canWithdraw,
    canWithdrawPerp,
    competition.tcAddress,
    competition.market,
    competition.id,
    competition.competitionRules?.startingBalance,
    competition.timestamp?.registrationEnd,
    t,
    pendingClaimPerp,
    claim,
    withdraw,
    isNotStartRegistration,
    isEndedRegistration,
    isFull,
    account,
    openConnectModal,
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

  useEffect(() => {
    autoWithdrawTcPerp()
  }, [autoWithdrawTcPerp])

  return (
    <div className='col-span-12 mt-2 lg:col-span-5 lg:mt-14 lg:max-h-[500px]'>
      <div className='flex items-center justify-between'>
        <h3 className='mb-5'>{headingAndText.heading}</h3>
        {isTCJoined && account && <EmphasisIconButton Icon={shareIconButton} onClick={onShareTC} />}
      </div>
      <Box className='flex flex-col space-y-5'>
        {(headingAndText.subText || headingAndText.text) && (
          <Box className='border-primary-800 bg-primary-950 flex flex-col space-y-2 border'>
            {headingAndText.text && <TextHeading className='text-xl'>{headingAndText.text}</TextHeading>}
            {headingAndText.subText && (
              <TextHeading className='flex text-base'>
                {headingAndText.subText}&nbsp;
                {totalPrizeUsd !== null && (
                  <span className='mr-1 flex flex-row gap-1'>
                    ${formatAmount(totalPrizeUsd)}
                    <InfoNeutralIcon className='h4 w-4' data-tooltip-id={`price-tool-tips-${competition.id}`} />
                    <CustomTooltip id={`price-tool-tips-${competition.id}`} className='max-w-[320px]' place='bottom'>
                      {totalPrizeByToken.map(item => (
                        <p key={item}>{item}</p>
                      ))}
                    </CustomTooltip>
                  </span>
                )}
                {headingAndText.endOfSubText}
              </TextHeading>
            )}
            {!isInvalidAmount(deposit) ? (
              <>
                <TextHeading className='text-base'>
                  {t('Your Deposit')} ={' '}
                  {formatAmount(fromWei(deposit, competition?.competitionRules?.winningToken?.decimals).toString())}{' '}
                  {competition.competitionRules?.winningToken?.symbol}
                </TextHeading>
                {checkDisplayTextDeposit && (
                  <TextHeading className='text-base'>
                    {t(
                      competition.market === TC_MARKET_TYPES.SPOT
                        ? 'You can add more Deposit until the competition starts'
                        : 'You can add more Deposit until the competition ends',
                    )}
                  </TextHeading>
                )}
              </>
            ) : (
              checkDisplayTextDeposit && (
                <TextHeading className='text-base'>
                  {t(
                    competition.market === TC_MARKET_TYPES.SPOT
                      ? 'Add Deposit to trade before competition starts'
                      : 'Add Deposit to trade before competition ends',
                  )}
                </TextHeading>
              )
            )}
          </Box>
        )}

        <div className='flex flex-col items-center justify-center gap-2'>
          <div className='h-3 w-full rounded-md bg-neutral-500'>
            <div ref={progressBarRef} className='block h-full rounded-md bg-linear-to-r from-[#B386FF] to-[#FF86FA]' />
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
        {account && mounted && eventType !== EVENT_TYPES.ENDED && (
          <>
            <OutlinedButton
              data-tooltip-id='showTooltip'
              disabled={isNotStartRegistration}
              onClick={() => setShowIncreasePrize(true)}
              className='text-neutral-400!'
            >
              {t('Increase Prize Pool')}
              {eventType === EVENT_TYPES.UPCOMING && <InfoCirCleDisableIcon className='h-4 w-4 text-neutral-400!' />}
            </OutlinedButton>
            {isNotStartRegistration ? (
              <CustomTooltip
                className='z-50 max-w-[320px] min-w-[136px] bg-neutral-500! shadow-xl after:bg-neutral-500!'
                id='showTooltip'
                place='bottom'
              >
                {t('You Can Only Increase The Prize After Registration Starts')}
              </CustomTooltip>
            ) : (
              <CustomTooltip
                className='z-50 max-w-[320px] min-w-[136px] bg-neutral-500! shadow-xl after:bg-neutral-500!'
                id='showTooltip'
                place='bottom'
              >
                {t('Increase Prize Pool warning')}
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
          balance={deallocatableBalance}
          onClose={() => {
            setShowModalDeallocate(false)
            checkWithdrawableTCPerp()
            getWithdrawCooldown()
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
