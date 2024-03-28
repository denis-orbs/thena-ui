import dayjs from 'dayjs'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Cover from 'public/cover.png'
import { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { Paragraph } from '@/components/typography'
import { formatAmount, fromWei } from '@/lib/utils'
import { Clock, CoinHand, Gift } from '@/svgs'

function CompetitionItem({ competition, tokens, account }) {
  const t = useTranslations()
  const { push } = useRouter()

  const totalPrize = useMemo(() => {
    const tokenType = tokens.find(
      token => token.address.toLowerCase() === competition.competitionRules.winningToken.toLowerCase(),
    )

    return tokenType
      ? `${formatAmount(fromWei(competition.prize.totalPrize, tokenType.decimals))} ${tokenType.symbol}`
      : ''
  }, [competition.competitionRules.winningToken, competition.prize.totalPrize, tokens])

  const entryFee = useMemo(() => {
    if (competition.entryFee !== '0') {
      const tokenType = tokens.find(token => token.address.toLowerCase() === competition.prize.token.toLowerCase())

      return tokenType ? `${formatAmount(fromWei(competition.entryFee, tokenType.decimals))} ${tokenType.symbol}` : ''
    }
    return t('Free To Enter')
  }, [competition.prize.token, competition.entryFee, t, tokens])

  const isUpcoming = competition.timestamp.startTimestamp > new Date().getTime() / 1000

  const isLive =
    competition.timestamp.startTimestamp <= new Date().getTime() / 1000 &&
    new Date().getTime() / 1000 <= competition.timestamp.endTimestamp

  const isEnded = competition.timestamp.endTimestamp < new Date().getTime() / 1000

  const timestampToStatus = () => {
    if (isUpcoming) return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Upcoming')}</NeutralBadge>

    if (isLive) return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Live')}</NeutralBadge>

    if (isEnded) return <NeutralBadge className='text-nowrap lg:text-xs'>{t('Ended')}</NeutralBadge>
  }

  const timeDistance = unix => {
    const now = dayjs()
    const timestamp = dayjs.unix(unix)

    const inSeconds = now.diff(timestamp, 'second')
    const inMinutes = now.diff(timestamp, 'minute')
    const inHours = now.diff(timestamp, 'hour')
    const inDays = now.diff(timestamp, 'day')
    const inMonths = now.diff(timestamp, 'month')
    const inYears = now.diff(timestamp, 'year')

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
  }

  const isHosting = useMemo(() => account && account === competition.owner.id, [account, competition.owner.id])

  const isJoined = useMemo(
    () =>
      competition.participants.length && account
        ? competition.participants.find(participant => participant.participant.id === account)
        : false,
    [account, competition.participants],
  )

  return (
    <Box className='flex w-full cursor-pointer flex-col gap-4 p-6'>
      <div className='relative'>
        <Image className='h-[200px] w-full rounded-xl' src={Cover} alt='image' />
        <div className='absolute left-4 top-4 flex gap-2'>
          <NeutralBadge className='text-nowrap capitalize lg:text-xs'>{competition.market.toLowerCase()}</NeutralBadge>
          {timestampToStatus()}
        </div>
      </div>
      <div>
        <h3>{competition.name}</h3>
        <div className='flex w-full items-center justify-start gap-4 py-2'>
          <Paragraph className='flex gap-1'>
            <div className='h-5 w-5'>
              <Clock />
            </div>
            {isUpcoming
              ? timeDistance(competition.timestamp.startTimestamp)
              : timeDistance(competition.timestamp.endTimestamp)}
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
      <div className='flex w-full items-center justify-between gap-4'>
        <EmphasisButton className='w-full' onClick={() => push(`arena/trading-competitions/${competition.id}`)}>
          {t('View')}
        </EmphasisButton>

        {isJoined && isLive && <PrimaryButton className='w-full'>{t('Trade Now')}</PrimaryButton>}
        {isEnded && (isJoined || isHosting) && <PrimaryButton className='w-full'>{t('Claim Rewards')}</PrimaryButton>}
        {isUpcoming && !isJoined && !isHosting && <PrimaryButton className='w-full'>{t('Join Now')}</PrimaryButton>}
      </div>
    </Box>
  )
}

export default CompetitionItem
