'use client'

import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { Paragraph } from '@/components/typography'
import { EVENT_TYPES, getEventType } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'
import { TCButton } from '@/modules/TradingCompetition/TCButton'
import { Clock, CoinHand, Gift } from '@/svgs'

import { CompetitionCardHeader } from './CompetitionCardHeader'

function CompetitionItem({ competition, account }) {
  const t = useTranslations()

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

  const eventType = useMemo(() => getEventType(competition.timestamp), [competition.timestamp])

  const timeDistance = useMemo(() => {
    const unix =
      eventType === EVENT_TYPES.UPCOMING ? competition.timestamp.startTimestamp : competition.timestamp.endTimestamp
    const now = dayjs()
    const timestamp = dayjs.unix(unix)

    const inSeconds = Math.abs(now.diff(timestamp, 'second'))
    const inMinutes = Math.abs(now.diff(timestamp, 'minute'))
    const inHours = Math.abs(now.diff(timestamp, 'hour'))
    const inDays = Math.abs(now.diff(timestamp, 'day'))
    const inMonths = Math.abs(now.diff(timestamp, 'month'))
    const inYears = Math.abs(now.diff(timestamp, 'year'))

    if (inMonths >= 12) {
      return `${inYears} ${inYears === 1 ? t('Year') : t('Years')}`
    }

    if (inDays >= 30) {
      return `${inMonths} ${inMonths === 1 ? t('Month') : t('Months')}`
    }

    if (inHours >= 24) {
      return `${inDays} ${inDays === 1 ? t('Day') : t('Days')}`
    }
    if (inMinutes >= 60) {
      return `${inHours} ${inHours === 1 ? t('Hour') : t('Hours')}`
    }
    if (inSeconds >= 60) {
      return `${inMinutes} ${inMinutes === 1 ? t('Minute') : t('Minutes')}`
    }
    return `${inSeconds} ${inSeconds === 1 ? t('Second') : t('Seconds')}`
  }, [competition.timestamp.endTimestamp, competition.timestamp.startTimestamp, eventType, t])

  return (
    <Box className='flex w-full cursor-pointer flex-col gap-4 p-6'>
      <div className='relative'>
        <CompetitionCardHeader className='h-[200px] w-full' competition={competition} />
        <div className='absolute left-4 top-4 flex gap-2'>
          <NeutralBadge className='text-nowrap capitalize lg:text-xs'>{competition.market.toLowerCase()}</NeutralBadge>
          <NeutralBadge className='text-nowrap lg:text-xs'>{t(getEventType(competition.timestamp))}</NeutralBadge>
        </div>
        <NeutralBadge className='absolute right-4 top-4 text-nowrap capitalize lg:text-xs'>
          {`${competition.participantCount}/${competition.maxParticipants}`}
        </NeutralBadge>
      </div>
      <div>
        <h3>{competition.name}</h3>
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
      <TCButton eventType={eventType} competition={competition} account={account} />
    </Box>
  )
}

export default CompetitionItem
