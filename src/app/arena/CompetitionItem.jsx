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
import { cn, formatAddress, formatAmount, fromWei, isHexColor, isInvalidAmount } from '@/lib/utils'
import { VerifyPopover } from '@/modules/Profile/VerifyPopover'
import { TCButton } from '@/modules/TradingCompetition/TCButton'
import { Clock, CoinHand, GiftArenaIcon, UserIcon } from '@/svgs'

import { CompetitionCardHeader } from './CompetitionCardHeader'

function CompetitionItem({ competition, showCheckedHidden = false, updateIsHidden = () => {} }) {
  const t = useTranslations()

  const { eventType } = useEventType(competition?.timestamp)

  const totalPrize = useMemo(
    () => {
      let totalPrizeArray = []
      totalPrizeArray = competition.prizeUpdate.token.map((item, index) => ({
        data: formatAmount(fromWei(competition.prizeUpdate.totalPrize[index], item?.decimals)),
        ticker: item?.symbol,
      }))

      if (totalPrizeArray.some(item => !isInvalidAmount(item.data))) {
        totalPrizeArray = totalPrizeArray.filter(item => !isInvalidAmount(item.data))
      }

      return totalPrizeArray.map(item => `${item.data} ${item.ticker}`).join(', ')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competition.prizeUpdate.totalPrize, competition.prizeUpdate?.token],
  )

  const entryFee = useMemo(() => {
    if (competition.entryFeeUpdate.some(item => Number(item) !== 0)) {
      return competition.entryFeeUpdate
        .filter(entry => !isInvalidAmount(entry))
        .map(
          (item, index) =>
            `${formatAmount(fromWei(item, competition.prizeUpdate?.token?.[index]?.decimals))} ${
              competition.prizeUpdate?.token?.[index]?.symbol
            }`,
        )
        .join(', ')
    }
    return t('Free To Enter')
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return !timeDistance || !entryFee || !eventType ? (
    <Skeleton className='h-[320px] w-full' />
  ) : (
    <Box className='flex w-full flex-col gap-3 p-4 lg:p-3 xl:gap-4 xl:p-6'>
      <div className='relative'>
        <CompetitionCardHeader
          className='aspect-video w-full'
          competition={competition}
          banner={competition.bannerUrl}
        />
        <div className='absolute left-4 top-4 flex gap-2'>
          <NeutralBadge className='text-nowrap capitalize lg:text-xs'>{competition.market.toLowerCase()}</NeutralBadge>
          <NeutralBadge className={`text-nowrap lg:text-xs ${bgStatus}`}>{t(eventType)}</NeutralBadge>
        </div>
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
      <div>
        <div className='flex items-center gap-2'>
          <h3 title={competition.name} className='ellipsis-3'>
            {competition.name}
          </h3>
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
        <div className='w-full space-y-2 py-2'>
          <div>
            <Paragraph className='flex flex-1 gap-1 text-nowrap'>
              <Clock className='h-5 w-5' />
              <span>{timeDistance}</span>
            </Paragraph>
          </div>
          {totalPrize && (
            <div className='ellipsis-1 w-full' title={totalPrize}>
              <Paragraph className='flex flex-1 gap-1 text-nowrap'>
                <GiftArenaIcon className='h-5 w-5' />
                <span>{totalPrize}</span>
              </Paragraph>
            </div>
          )}
          <div className='ellipsis-1 w-full' title={entryFee}>
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
