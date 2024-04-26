'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import Skeleton from '@/components/skeleton'
import Toggle from '@/components/toggle'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { useCountdown } from '@/hooks/useCountdown'
import { useEventType } from '@/hooks/useEventType'
import { formatAddress, formatAmount, fromWei } from '@/lib/utils'
import { TCButton } from '@/modules/TradingCompetition/TCButton'
import { Clock, CoinHand, Gift, Verified } from '@/svgs'

import { CompetitionCardHeader } from './CompetitionCardHeader'

function CompetitionItem({ competition, showCheckedHidden = false }) {
  const t = useTranslations()

  const { eventType } = useEventType(competition?.timestamp)

  const totalPrize = useMemo(
    () =>
      `${formatAmount(fromWei(competition.prize.totalPrize, competition.prize?.token?.decimals))} ${
        competition.prize?.token?.symbol
      }`,
    [competition.prize.totalPrize, competition.prize?.token?.decimals, competition.prize?.token?.symbol],
  )

  const entryFee = useMemo(() => {
    if (competition.entryFee !== '0') {
      return `${formatAmount(fromWei(competition.entryFee, competition.competitionRules?.winningToken?.decimals))} ${
        competition.competitionRules?.winningToken?.symbol
      }`
    }
    return t('Free To Enter')
  }, [competition.entryFee, competition.competitionRules.winningToken, t])

  const { text: timeDistance } = useCountdown(eventType, competition.timestamp.startTimestamp)

  return !timeDistance || !totalPrize || !entryFee || !eventType ? (
    <Skeleton className='h-[320px] w-full' />
  ) : (
    <Box className='flex w-full flex-col gap-4 p-6'>
      <div className='relative'>
        <CompetitionCardHeader className='h-[200px] w-full' competition={competition} />
        <div className='absolute left-4 top-4 flex gap-2'>
          <NeutralBadge className='text-nowrap capitalize lg:text-xs'>{competition.market.toLowerCase()}</NeutralBadge>
          <NeutralBadge className='text-nowrap lg:text-xs'>{t(eventType)}</NeutralBadge>
        </div>
        {!showCheckedHidden ? (
          <NeutralBadge className='absolute right-4 top-4 text-nowrap capitalize lg:text-xs'>
            {`${competition.participantCount}/${competition.maxParticipants}`}
          </NeutralBadge>
        ) : (
          <div className='absolute right-4 top-4 flex flex-row items-center'>
            <Toggle checked={competition.hidden} />
            <TextSubHeading>Hide</TextSubHeading>
          </div>
        )}
      </div>
      <div>
        <div className='flex items-center gap-2'>
          <h3>{competition.name}</h3>
          {competition.owner.isVerified && (
            <div className='flex items-center gap-1 text-nowrap'>
              {competition.owner.name ? (
                <h4 className='inline-block bg-gradient-to-r from-[#C72AD0] to-[#AA23DB] bg-clip-text text-3xl font-bold text-transparent'>
                  by {formatAddress(competition.owner.username)}
                </h4>
              ) : (
                <h4>by {formatAddress(competition.owner.id)}</h4>
              )}
              <div className='h-5 w-5'>
                <Verified />
              </div>
            </div>
          )}
        </div>
        <div className='flex w-full flex-wrap items-center justify-start gap-4 text-nowrap py-2'>
          <Paragraph className='flex gap-1'>
            <div className='h-5 w-5'>
              <Clock />
            </div>
            {timeDistance}
          </Paragraph>
          <Paragraph className='flex gap-1'>
            <div className='h-5 w-5'>
              <Gift />
            </div>
            {totalPrize}
          </Paragraph>
          <Paragraph className='flex gap-1'>
            <div className='h-5 w-5'>
              <CoinHand />
            </div>
            {entryFee}
          </Paragraph>
        </div>
      </div>
      <TCButton eventType={eventType} competition={competition} timestamp={competition.timestamp} />
    </Box>
  )
}

export default CompetitionItem
