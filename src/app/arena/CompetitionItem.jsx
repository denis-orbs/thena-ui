'use client'

import { useTranslations } from 'next-intl'
import Banner from 'public/images/arena/tc_cover_image.png'
import React, { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import Skeleton from '@/components/skeleton'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
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
  const assets = useAssets()
  const parseToUSD = useMemo(() => {
    let dataCurrentPrizePool = []
    dataCurrentPrizePool = competition?.prizeUpdate?.token.map((item, index) => ({
      data: formatAmount(fromWei(competition?.prizeUpdate?.totalPrize[index], item?.decimals)),
      ticker: item?.symbol,
      dataNumber: fromWei(competition?.prizeUpdate?.totalPrize[index], item?.decimals),
    }))
    const dataAllCurrentPrizePool = [...dataCurrentPrizePool]
    if (dataCurrentPrizePool.some(item => !isInvalidAmount(item.data))) {
      dataCurrentPrizePool = dataCurrentPrizePool.filter(item => !isInvalidAmount(item.data))
    }
    const result = dataAllCurrentPrizePool.reduce((acc, cur, index) => {
      const tokenAsset = assets.find(item => item.address === competition?.prizeUpdate?.token?.[index]?.address)
      if (tokenAsset) {
        const value = cur.dataNumber
        return acc + value * tokenAsset.price
      }
      return acc
    }, 0)
    return result
  }, [competition?.prizeUpdate?.token, competition?.prizeUpdate?.totalPrize, assets])
  const { eventType } = useEventType(competition?.timestamp)

  const totalPrizeByToken = useMemo(() => {
    let totalPrizeArray = []
    totalPrizeArray = competition.prizeUpdate.token.map((item, index) => ({
      data: formatAmount(fromWei(competition.prizeUpdate.totalPrize[index], item?.decimals)),
      ticker: item?.symbol,
    }))

    if (totalPrizeArray.some(item => !isInvalidAmount(item.data))) {
      totalPrizeArray = totalPrizeArray.filter(item => !isInvalidAmount(item.data))
    }

    return totalPrizeArray.map(item => `${item.data} ${item.ticker}`)
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
    <div className='border-gradient-secondary mt-6 rounded-xl p-px'>
      <Skeleton className='h-full min-h-[500px] w-full rounded-xl p-px lg:min-h-[520px]' />
    </div>
  ) : (
    <div className='border-gradient-secondary mt-6 rounded-xl p-px'>
      <Box className='flex h-full w-full flex-col gap-3 p-4 lg:p-3 xl:gap-4 xl:p-6'>
        <div>
          <div className='relative'>
            <CompetitionCardHeader
              className='aspect-video w-full'
              competition={competition}
              banner={competition.bannerUrl || Banner.src}
            />
            {!showCheckedHidden ? (
              <NeutralBadge className='absolute top-4 right-4 flex items-center justify-center gap-1 text-nowrap capitalize lg:text-xs'>
                <UserIcon className='h-3 w-3' />
                {`${competition.participantCount}/${competition.maxParticipants}`}
              </NeutralBadge>
            ) : (
              <div className='absolute top-4 right-4 flex flex-row items-center'>
                <Toggle checked={competition.isHidden} onChange={updateIsHidden} />
                <TextSubHeading>Hide</TextSubHeading>
              </div>
            )}
          </div>
          <div className='mt-4 flex items-center justify-between gap-2'>
            <div className='flex gap-2'>
              <NeutralBadge className={`text-nowrap lg:text-xs ${bgStatus}`}>{t(eventType)}</NeutralBadge>
              {competition?.tcTagAssignments?.map(tag => (
                <React.Fragment key={tag.id}>
                  <div data-tooltip-id={`tooltip-tags-${tag.id}`}>
                    <NeutralBadge
                      className={cn(
                        'text-nowrap capitalize lg:text-xs',
                        tag.tcTag.name === 'official' ? 'bg-primary-600' : 'bg-neutral-600',
                      )}
                    >
                      {tag.tcTag.name}
                    </NeutralBadge>
                  </div>
                  <CustomTooltip
                    className='z-999999 max-w-[320px] min-w-[136px] bg-neutral-500! shadow-xl after:bg-neutral-500!'
                    id={`tooltip-tags-${tag.id}`}
                    place='bottom'
                  >
                    {tag.tcTag.description}
                  </CustomTooltip>
                </React.Fragment>
              ))}
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
                <VerifyPopover
                  verifyImage={competition.owner.checkMarkIcon}
                  verifiedAt={competition.owner.verifiedAt}
                />
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-1 flex-col'>
          <h3 title={competition.name} className='mb-3 line-clamp-2'>
            {competition.name}
          </h3>
          <div className='mb-3 flex w-full flex-1 items-start justify-start gap-6'>
            <Paragraph className='flex items-center text-nowrap'>
              <PriceCup className='mr-2 h-5 w-5' />
              <span className='mr-1'>${formatAmount(parseToUSD)}</span>

              <PriceTooltip id={`price-tool-tips-${competition.id}`} tooltip={totalPrizeByToken} />
            </Paragraph>

            <Paragraph className='flex items-center text-nowrap'>
              <StackCoin className='mr-1 h-5 w-5' />
              <span>{entryFee}</span>
            </Paragraph>
          </div>
          <div className='mb-5'>
            <p className='text-base leading-5 font-medium'>
              {titleForTargetTime}
              {targetEventTime && <span className='font-bold'> {targetEventTime}</span>}
            </p>

            <div className='mt-3 inline-block h-3 w-full rounded-md bg-neutral-500'>
              <div
                style={{
                  width: `${percentCountDown}%`,
                }}
                className='block h-full rounded-md bg-linear-to-r from-[#B386FF] to-[#FF86FA]'
              />
            </div>
          </div>
          <TCButton eventType={eventType} competition={competition} timestamp={competition.timestamp} />
        </div>
      </Box>
    </div>
  )
}

export default CompetitionItem
