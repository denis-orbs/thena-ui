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
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAddress, formatAmount, fromWei } from '@/lib/utils'
import { TCButton } from '@/modules/TradingCompetition/TCButton'
import { Clock, CoinHand, Gift, Verified } from '@/svgs'

import { CompetitionCardHeader } from './CompetitionCardHeader'

function CompetitionItem({ competition, showCheckedHidden = false, updateIsHidden = () => {} }) {
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

  const bgStatus = useMemo(() => {
    if (eventType) {
      switch (eventType) {
        case EVENT_TYPES.UPCOMING:
          return 'bg-green-700'
        case EVENT_TYPES.LIVE:
          return 'bg-blue-500'
        case EVENT_TYPES.ENDED:
          return 'bg-red-600'
        default:
          return ''
      }
    }
    return ''
  }, [eventType])

  return !timeDistance || !totalPrize || !entryFee || !eventType ? (
    <Skeleton className='h-[320px] w-full' />
  ) : (
    <Box className='flex w-full flex-col gap-4 p-6'>
      <div className='relative'>
        <CompetitionCardHeader className='h-[200px] w-full' competition={competition} />
        <div className='absolute left-4 top-4 flex gap-2'>
          <NeutralBadge className='text-nowrap capitalize lg:text-xs'>{competition.market.toLowerCase()}</NeutralBadge>
          <NeutralBadge className={`text-nowrap lg:text-xs ${bgStatus}`}>{t(eventType)}</NeutralBadge>
        </div>
        {!showCheckedHidden ? (
          <NeutralBadge className='absolute right-4 top-4 text-nowrap capitalize lg:text-xs'>
            {`${competition.participantCount}/${competition.maxParticipants}`}
          </NeutralBadge>
        ) : (
          <div className='absolute right-4 top-4 flex flex-row items-center'>
            <Toggle checked={competition.isHidden} onChange={updateIsHidden} />
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
                  {t('By')}{' '}
                  <span style={competition.owner.nameColor ? { color: competition.owner.nameColor } : {}}>
                    {formatAddress(competition.owner.username)}
                  </span>
                </h4>
              ) : (
                <h4>
                  {t('By')}{' '}
                  <span style={competition.owner.nameColor ? { color: competition.owner.nameColor } : {}}>
                    {formatAddress(competition.owner.id)}
                  </span>
                </h4>
              )}
              <div className='h-5 w-5'>
                <Verified />
              </div>
            </div>
          )}
        </div>
        <div className='w-full py-2'>
          <div>
            <Paragraph className='flex flex-1 gap-1 text-nowrap'>
              <Clock className='h-5 w-5' />
              <span>{timeDistance}</span>
            </Paragraph>
          </div>
          <div className='mt-2 flex w-full'>
            <Paragraph className='flex flex-1 gap-1 text-nowrap'>
              <Gift className='h-5 w-5' />
              <span>{totalPrize}</span>
            </Paragraph>
            <Paragraph className='flex flex-1 gap-1 text-nowrap'>
              <CoinHand className='h-5 w-5' />
              <span>{entryFee}</span>
            </Paragraph>
          </div>
        </div>
      </div>
      <TCButton eventType={eventType} competition={competition} timestamp={competition.timestamp} />
    </Box>
  )
}

export default CompetitionItem
