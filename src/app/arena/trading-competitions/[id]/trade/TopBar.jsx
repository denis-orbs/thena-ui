import BigNumber from 'bignumber.js'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import CustomTooltip from '@/components/tooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useCountdown } from '@/hooks/useCountdown'
import { useEventType } from '@/hooks/useEventType'
import { useTradeData } from '@/hooks/useTcSpotContract'
import { readCall } from '@/lib/contractActions'
import { getTcSpotContract } from '@/lib/contracts'
import { errorToast, successToast } from '@/lib/notify'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { ArrowLeftIcon, Champion, DownRank, InfoIcon, UpRank } from '@/svgs'

function TopBar({ handleClickShowModal = () => {}, competition = {}, reloadFetch = 0, setReloadFetch }) {
  const { id } = useParams()
  const t = useTranslations()
  const { account } = useWallet()

  const [isRegistrable, setIsRegistrable] = useState(true)
  const [currentRank, setCurrentRank] = useState(0)

  const [participants, setParticipants] = useState(competition?.participants || [])

  const { eventType } = useEventType(competition?.timestamp)

  const { text } = useCountdown(
    eventType,
    eventType === EVENT_TYPES.LIVE ? competition?.timestamp?.endTimestamp : competition?.timestamp?.startTimestamp,
    true,
  )

  const { balance, pnl } = useTradeData(
    competition?.tradingCompetitionSpot,
    competition?.competitionRules?.winningToken?.address,
  )

  const getPnl = useCallback(async () => {
    if (competition?.participants && competition?.tradingCompetitionSpot) {
      const temp = [...competition.participants]
      if (temp && temp.length) {
        const tcSpotContract = getTcSpotContract(competition?.tradingCompetitionSpot)
        for (const ptcp of competition.participants) {
          const pnlRes = await readCall(tcSpotContract, 'getPNLOf', [ptcp.participant.id])
          ptcp.pnl = new BigNumber(pnlRes).toNumber()
        }

        setParticipants(temp)
      }
    }
  }, [competition.participants, competition?.tradingCompetitionSpot])

  const calcRankAfterSwap = useCallback(async () => {
    if (competition?.participants && competition?.tradingCompetitionSpot) {
      const temp = [...competition.participants]
      if (temp && temp.length) {
        const tcSpotContract = getTcSpotContract(competition.tradingCompetitionSpot)
        for (const ptcp of competition.participants) {
          const pnlRes = await readCall(tcSpotContract, 'getPNLOf', [ptcp.participant.id])
          ptcp.pnl = new BigNumber(pnlRes).toNumber()
        }

        const sort =
          temp.sort(
            (a, b) =>
              fromWei(b.pnl, competition.competitionRules?.winningToken?.decimals) -
              fromWei(a.pnl, competition.competitionRules?.winningToken?.decimals),
          ) || []
        const newRank = sort.findIndex(item => item.participant.id === account?.toLocaleLowerCase()) + 1
        if (newRank === 1) {
          successToast('You’re in 1st place. Good job!', null, ChainId.BSC, <Champion className='h-4 w-4' />)
        } else {
          successToast(
            `You’re now rank ${newRank} of ${competition.participants.length}`,
            null,
            ChainId.BSC,
            <UpRank className='h-3 w-3' />,
          )
        }
        setCurrentRank(newRank)
      }
    }
  }, [
    account,
    competition.competitionRules?.winningToken?.decimals,
    competition.participants,
    competition.tradingCompetitionSpot,
  ])

  useEffect(() => {
    if (reloadFetch > 0) {
      calcRankAfterSwap()
      setReloadFetch(0)
    }
  }, [calcRankAfterSwap, reloadFetch, setReloadFetch])

  useEffect(() => {
    getPnl()
  }, [getPnl])

  useEffect(() => {
    const sort =
      participants.sort(
        (a, b) =>
          fromWei(b.pnl, competition.competitionRules?.winningToken?.decimals) -
          fromWei(a.pnl, competition.competitionRules?.winningToken?.decimals),
      ) || []

    const newRank = sort.findIndex(item => item.participant.id === account?.toLocaleLowerCase()) + 1
    if (currentRank === 1 && newRank !== currentRank) {
      errorToast(
        `You’re now rank ${newRank} of ${competition.participants.length}`,
        null,
        <DownRank className='h-3 w-3' />,
      )
    }
    setCurrentRank(newRank)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, competition.competitionRules?.winningToken?.decimals, account])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() / 1000
      const registerEndTime = competition?.timestamp?.registrationEnd
      const registerStartTime = competition?.timestamp?.registrationStart
      if (registerStartTime <= now && now <= registerEndTime) {
        setIsRegistrable(true)
      } else {
        setIsRegistrable(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [competition?.timestamp?.registrationEnd, competition?.timestamp?.registrationStart])

  return (
    <div className='my-10 flex flex-col gap-10'>
      <div>
        <Link href={`/arena/trading-competitions/${id}`}>
          <TextButton className='mb-6 pl-1' LeadingIcon={ArrowLeftIcon}>
            {t('Back')}
          </TextButton>
        </Link>
        <div className='flex justify-between'>
          <TextHeading className='text-xl lg:text-3xl'>{competition?.name}</TextHeading>
          {isRegistrable && (
            <PrimaryButton onClick={handleClickShowModal}>{`${t('Deposit')} ${t('More')}`}</PrimaryButton>
          )}
        </div>
      </div>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
        {eventType === (EVENT_TYPES.LIVE || EVENT_TYPES.ENDED) && (
          <>
            <Box className='flex flex-col items-start'>
              <TextHeading className='text-xl lg:text-2xl'>{`${currentRank}/${competition.participantCount}`}</TextHeading>
              <TextSubHeading>{t('Your Rank')}</TextSubHeading>
            </Box>
            <Box className='flex flex-col items-start'>
              <div className='flex w-full items-center justify-between lg:flex'>
                <div className='flex items-center justify-center space-x-2'>
                  <Image
                    alt='token'
                    src={`${competition.competitionRules?.winningToken?.logoURI ?? ''}`}
                    className='flex-shrink-0'
                    width={24}
                    height={24}
                    loading='lazy'
                  />
                  <TextHeading className='text-xl lg:text-2xl'>
                    {formatAmount(fromWei(pnl, competition.competitionRules?.winningToken?.decimals), false, 10, false)}
                  </TextHeading>
                </div>
                <InfoIcon className='hidden h-4 w-4 stroke-neutral-400 lg:block' data-tooltip-id='user-pnl-tooltip' />
                <CustomTooltip id='user-pnl-tooltip' className='max-w-[500px]'>
                  {t('This Is Your PNL', { ticker: competition.competitionRules?.winningToken?.symbol })}
                </CustomTooltip>
              </div>
              <TextSubHeading>{t('Your Profit & Loss')}</TextSubHeading>
            </Box>
          </>
        )}
        <Box className='flex flex-col items-start'>
          <div className='flex w-full items-center justify-between lg:flex'>
            <div className='flex items-center justify-center space-x-2'>
              <Image
                alt='USDC'
                src={`${competition.competitionRules?.winningToken?.logoURI ?? ''}`}
                className='flex-shrink-0'
                width={24}
                height={24}
                loading='lazy'
              />
              <TextHeading className='text-xl lg:text-2xl'>
                {formatAmount(fromWei(balance, competition.competitionRules?.winningToken?.decimals), false, 10)}
              </TextHeading>
            </div>
            <InfoIcon className='hidden h-4 w-4 stroke-neutral-400 lg:block' data-tooltip-id='user-balance-tooltip' />
            <CustomTooltip id='user-balance-tooltip' className='max-w-[500px]'>
              {t('This Is Your Balance', { ticker: competition.competitionRules?.winningToken?.symbol })}
            </CustomTooltip>
          </div>
          <TextSubHeading>{t('Your Balance')}</TextSubHeading>
        </Box>
        <Box className='flex flex-col items-start'>
          <TextHeading className='text-xl lg:text-2xl'>{text}</TextHeading>
          <TextSubHeading>
            {eventType === EVENT_TYPES.LIVE ? t('Competition End') : t('Competition Start')}
          </TextSubHeading>
        </Box>
      </div>
    </div>
  )
}

export default TopBar
