import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import CustomTooltip from '@/components/tooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useCountdown } from '@/hooks/useCountdown'
import { useEventType } from '@/hooks/useEventType'
import { useTradeData } from '@/hooks/useTcSpotContract'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { ArrowLeftIcon, InfoIcon } from '@/svgs'

function TopBar({ handleClickShowModal = () => {}, competition = {} }) {
  const { id } = useParams()
  const t = useTranslations()
  const { account } = useWallet()

  const [isRegistrable, setIsRegistrable] = useState(true)

  const { eventType } = useEventType(competition?.timestamp)

  const { text } = useCountdown(
    eventType,
    eventType === EVENT_TYPES.LIVE ? competition?.timestamp?.startTimestamp : competition?.timestamp?.endTimestamp,
    true,
  )

  const { balance, pnl } = useTradeData(
    competition?.tradingCompetitionSpot,
    competition?.competitionRules?.winningToken?.address,
  )

  const currentRank = useMemo(() => {
    const sort =
      competition.participants?.sort(
        (a, b) =>
          fromWei(b.pnl, competition.competitionRules?.winningToken?.decimals) -
          fromWei(a.pnl, competition.competitionRules?.winningToken?.decimals),
      ) || []
    return sort.findIndex(item => item.participant.id === account.toLocaleLowerCase()) + 1
  }, [competition.participants, competition.competitionRules?.winningToken?.decimals, account])

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
                    alt='USDC'
                    src={competition.competitionRules?.winningToken?.logoURI ?? ''}
                    className='flex-shrink-0'
                    width={24}
                    height={24}
                    loading='lazy'
                  />
                  <TextHeading className='text-xl lg:text-2xl'>
                    {formatAmount(fromWei(pnl, competition.competitionRules?.winningToken?.decimals))}
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
                src={competition.competitionRules?.winningToken?.logoURI ?? ''}
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
            {eventType === EVENT_TYPES.LIVE ? t('Competition Start') : t('Competition End')}
          </TextSubHeading>
        </Box>
      </div>
    </div>
  )
}

export default TopBar
