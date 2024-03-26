import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Cover from 'public/cover.png'
import React from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { Paragraph } from '@/components/typography'
import { Clock, CoinHand, Gift } from '@/svgs'

function CompetitionItem() {
  const t = useTranslations()
  return (
    <Box className='flex w-full cursor-pointer flex-col gap-4 p-6'>
      <div className='relative'>
        <Image className='h-[200px] w-full rounded-xl' src={Cover} alt='image' />
        <div className='absolute left-4 top-4 flex gap-2'>
          <NeutralBadge className='text-nowrap lg:text-xs'>Perpetual</NeutralBadge>
          <NeutralBadge className='text-nowrap lg:text-xs'>Upcoming</NeutralBadge>
        </div>
      </div>
      <div>
        <h3>Cum ceteris in veneratione tui montes, nascetur mus.</h3>
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
            $1123.87
          </Paragraph>
          <Paragraph className='flex gap-1'>
            <div className='h-5 w-5'>
              <CoinHand />
            </div>
            $456.78
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
