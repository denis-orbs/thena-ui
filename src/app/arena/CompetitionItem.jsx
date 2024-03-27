import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Cover from 'public/cover.png'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { Paragraph } from '@/components/typography'
import { formatAmount } from '@/lib/utils'
import { Clock, CoinHand, Gift } from '@/svgs'

function CompetitionItem({ competition }) {
  const t = useTranslations()

  const isUpcoming = competition.timestamp.startTimestamp > new Date().getTime()

  const isLive =
    competition.timestamp.startTimestamp <= new Date().getTime() &&
    new Date().getTime() <= competition.timestamp.endTimestamp

  const isEnded = competition.timestamp.endTimestamp < new Date().getTime()

  const timestampToStatus = () => {
    if (isUpcoming) return <NeutralBadge className='text-nowrap lg:text-xs'>Upcoming</NeutralBadge>

    if (isLive) return <NeutralBadge className='text-nowrap lg:text-xs'>Live</NeutralBadge>

    if (isEnded) return <NeutralBadge className='text-nowrap lg:text-xs'>Ended</NeutralBadge>
  }

  return (
    <Box className='flex w-full cursor-pointer flex-col gap-4 p-6'>
      <div className='relative'>
        <Image className='h-[200px] w-full rounded-xl' src={Cover} alt='image' />
        <div className='absolute left-4 top-4 flex gap-2'>
          <NeutralBadge className='text-nowrap lg:text-xs'>{competition.market}</NeutralBadge>
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
            7 days
          </Paragraph>
          <Paragraph className='flex gap-1'>
            <div className='h-5 w-5'>
              <Gift />
            </div>
            ${formatAmount(competition.prize.totalPrize, true)}
          </Paragraph>
          <Paragraph className='flex gap-1'>
            <div className='h-5 w-5'>
              <CoinHand />
            </div>
            ${formatAmount(competition.entryFee, true)}
          </Paragraph>
        </div>
      </div>
      <div className='flex w-full items-center justify-between gap-4'>
        <EmphasisButton className='w-full'>{t('View')}</EmphasisButton>
        <PrimaryButton className='w-full'>{t('Trade now')}</PrimaryButton>
      </div>
    </Box>
  )
}

export default CompetitionItem
