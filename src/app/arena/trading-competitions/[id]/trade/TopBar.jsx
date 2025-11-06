import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import Loading from '@/app/loading'
import Box from '@/components/box'
import BackButton from '@/components/buttons/BackButton'
import CustomTooltip from '@/components/tooltip'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { fetchUserRankAndPnLInTC } from '@/hooks/trade/useTradingCompetitionLeaderboard'
import { useCountdown } from '@/hooks/useCountdown'
import { useEventType } from '@/hooks/useEventType'
import useWallet from '@/hooks/useWallet'
import InfoIcon from '@/icons/InfoIcon'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'

function TopBar({ competition = {}, balance }) {
  const { id } = useParams()
  const t = useTranslations()
  const { account } = useWallet()

  const [rank, setRank] = useState()
  const [pnl, setPnl] = useState(0)

  const {
    data: competitionUser,
    isLoading: isLoadingCompetitionUser,
    isRefetching,
  } = useQuery({
    queryKey: ['user rank and pnl in TC', id, account?.toLowerCase()],
    queryFn: () => fetchUserRankAndPnLInTC(id, account?.toLowerCase()),
    refetchInterval: 15000,
    gcTime: 0,
    enabled: Boolean(id, account),
  })

  const { eventType } = useEventType(competition?.timestamp)

  const { text } = useCountdown(
    eventType,
    eventType === EVENT_TYPES.LIVE ? competition?.timestamp?.endTimestamp : competition?.timestamp?.startTimestamp,
    true,
  )

  useEffect(() => {
    if (competitionUser?.participants?.[0] && !isRefetching) {
      setPnl(competitionUser?.participants?.[0].pnl)
      setRank(prev => {
        const newRank = competitionUser.participants[0].rank
        if (newRank !== prev) {
          return newRank
        }

        return prev
      })
    }
  }, [competition.participants.length, competitionUser, isRefetching])

  if (isLoadingCompetitionUser) {
    return <Loading />
  }

  return (
    <div className='my-10 flex flex-col gap-10'>
      <div>
        <BackButton href={`/arena/trading-competitions/${id}`} />
        <div className='mt-6 flex justify-between'>
          <TextHeading className='text-xl lg:text-3xl'>{competition?.name}</TextHeading>
        </div>
      </div>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
        {eventType === (EVENT_TYPES.LIVE || EVENT_TYPES.ENDED) && (
          <>
            <Box className='flex flex-col items-start'>
              <TextHeading className='text-xl lg:text-2xl'>
                {`${rank === undefined || rank === null ? '-' : rank + 1}/${competition.participantCount}`}
              </TextHeading>
              <TextSubHeading>{t('Your Rank')}</TextSubHeading>
            </Box>
            <Box className='flex flex-col items-start'>
              <div className='flex w-full items-center justify-between lg:flex'>
                <div className='flex items-center justify-center gap-2'>
                  <Image
                    alt='token'
                    src={`${competition.competitionRules?.winningToken?.logoURI ?? ''}`}
                    className='shrink-0'
                    width={24}
                    height={24}
                    loading='lazy'
                  />
                  <TextHeading className='text-xl lg:text-2xl'>
                    {formatAmount(fromWei(pnl, competition?.competitionRules?.winningTokenDecimal), false, 10, false)}
                  </TextHeading>
                </div>
                <InfoIcon className='hidden lg:block' data-tooltip-id='user-pnl-tooltip' />
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
            <div className='flex items-center justify-center gap-2'>
              <Image
                alt={`${competition.competitionRules?.winningToken?.symbol ?? 'token'}`}
                src={`${competition.competitionRules?.winningToken?.logoURI ?? ''}`}
                className='shrink-0'
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
