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
import { useTCStatus } from '@/hooks/useTCStatus'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { cn, formatAddress, formatAmount, fromWei, isHexColor, isInvalidAmount } from '@/lib/utils'
import { VerifyPopover } from '@/modules/Profile/VerifyPopover'
import { TCButton } from '@/modules/TradingCompetition/TCButton'
import { PriceCup, StackCoin, UserIcon } from '@/svgs'

import { CompetitionCardHeader } from './CompetitionCardHeader'
import PriceTooltip from './PriceTooltip'

function CompetitionItem({ competition, showCheckedHidden = false, updateIsHidden = () => {} }) {
  const t = useTranslations()

  const { eventType } = useEventType(competition?.timestamp)

  const totalPrize = useMemo(() => {
    let totalPrizeArray = []
    totalPrizeArray = competition.prizeUpdate.token.map((item, index) => ({
      data: formatAmount(fromWei(competition.prizeUpdate.totalPrize[index], item?.decimals)),
      ticker: item?.symbol,
    }))

    if (totalPrizeArray.some(item => !isInvalidAmount(item.data))) {
      totalPrizeArray = totalPrizeArray.filter(item => !isInvalidAmount(item.data))
    }

    return totalPrizeArray.map(item => `${item.data} ${item.ticker}`).join('&#10;')
  }, [competition.prizeUpdate.totalPrize, competition.prizeUpdate?.token])

  const entryFee = useMemo(() => {
    let entryFeeArray = competition.entryFeeUpdate.map((item, index) => ({
      data: formatAmount(fromWei(item, competition.prizeUpdate?.token?.[index]?.decimals)),
      symbol: competition.prizeUpdate?.token?.[index]?.symbol,
    }))

    if (entryFeeArray.some(item => !isInvalidAmount(item.data))) {
      entryFeeArray = entryFeeArray.filter(item => !isInvalidAmount(item.data))

      return entryFeeArray.map(item => `${item.data} ${item.symbol}`).join(', ')
    }

    return t('Free To Enter')
  }, [competition.entryFeeUpdate, competition.prizeUpdate?.token, t])

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

  const { targetEventTime, titleForTargetTime, percentCountDown } = useTCStatus(competition?.timestamp)

  return !timeDistance || !entryFee || !eventType ? (
    <Skeleton className='h-[320px] w-full' />
  ) : (
    <Box className='flex w-full flex-col justify-between gap-3 p-4 lg:p-3 xl:gap-4 xl:p-6'>
      <div>
        <div className='relative'>
          <CompetitionCardHeader
            className='aspect-video w-full'
            competition={competition}
            banner={competition.bannerUrl}
          />
          {!showCheckedHidden ? (
            <NeutralBadge className='absolute right-4 top-4 flex items-center justify-center gap-1 text-nowrap capitalize lg:text-xs'>
              <UserIcon className='h-3 w-3' />
              {`${competition.participantCount}/${competition.maxParticipants}`}
            </NeutralBadge>
          ) : (
            <div className='absolute right-4 top-4 flex flex-row items-center'>
              <Toggle checked={competition.isHidden} onChange={updateIsHidden} />
              <TextSubHeading>Hide</TextSubHeading>
            </div>
          )}
        </div>
        <div className='mt-4 flex items-center justify-between gap-2'>
          <div className='flex gap-2'>
            <NeutralBadge className={`text-nowrap lg:text-xs ${bgStatus}`}>{t(eventType)}</NeutralBadge>
            <NeutralBadge className='text-nowrap capitalize lg:text-xs'>
              {competition.market.toLowerCase()}
            </NeutralBadge>
          </div>

          {competition.owner.isVerified && (
            <div className='flex items-center gap-1 text-nowrap'>
              <h4 className='inline-block'>
                {t('By')}{' '}
                <span
                  style={
                    competition.owner.nameColor
                      ? {
                          color: competition.owner.nameColor.startsWith('#')
                            ? competition.owner.nameColor
                            : `#${competition.owner.nameColor}`,
                        }
                      : {}
                  }
                  className={cn(!isHexColor(competition.owner.nameColor) && `${competition.owner.nameColor}`)}
                >
                  {competition.owner.username ? competition.owner.username : formatAddress(competition.owner.id)}
                </span>
              </h4>
              <VerifyPopover verifyImage={competition.owner.checkMarkIcon} verifiedAt={competition.owner.verifiedAt} />
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 title={competition.name} className='ellipsis-3 mb-3'>
          {competition.name}
        </h3>
        <div className='mb-3 flex w-full items-center justify-start gap-6'>
          <Paragraph className='flex items-center text-nowrap'>
            <PriceCup className='mr-2 h-5 w-5' />
            <span className='mr-1'>${formatAmount(competition.totalPrizeUSD)}</span>

            <PriceTooltip id={`price-tool-tips-${competition.id}`} tooltip={totalPrize} />
          </Paragraph>

          <Paragraph className='flex items-center text-nowrap'>
            <StackCoin className='mr-1 h-5 w-5' />
            <span>{entryFee}</span>
          </Paragraph>
        </div>
        <div className='mb-5'>
          <p className='text-base font-medium leading-5'>
            {titleForTargetTime}
            {targetEventTime && <span className='font-bold'> {targetEventTime}</span>}
          </p>

          <div className='mt-3 inline-block h-3 w-full rounded-md bg-neutral-500'>
            <div
              style={{
                width: `${percentCountDown}%`,
              }}
              className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
            />
          </div>
        </div>
        <TCButton eventType={eventType} competition={competition} timestamp={competition.timestamp} />
      </div>
    </Box>
  )
}

export default CompetitionItem
