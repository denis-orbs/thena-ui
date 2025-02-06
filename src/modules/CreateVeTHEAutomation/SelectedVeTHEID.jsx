import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading } from '@/components/typography'
import usePrices from '@/hooks/usePrices'
import { formatAmount } from '@/lib/utils'

function SelectedVeTHEID({ veTHESelected }) {
  const t = useTranslations()
  const prices = usePrices()

  if (!veTHESelected) {
    return <Skeleton className='h-full w-full' />
  }

  const { id, lockedEnd, voting_amount, amount } = veTHESelected

  return (
    <Box>
      <h3 className='font-archia text-xl font-semibold lg:text-2xl'>{t('Selected veTHE ID')}</h3>
      <div className='mt-2 grid grid-cols-2 gap-6'>
        <div className='flex flex-col gap-1'>
          <TextHeading>veTHE ID</TextHeading>
          <TextHeading className='text-neutral-300'>{id}</TextHeading>
        </div>
        <div className='flex flex-col gap-1'>
          <TextHeading>Lock Expire</TextHeading>
          <TextHeading className='text-neutral-300'>{dayjs.unix(lockedEnd).format('MMM D, YYYY')}</TextHeading>
        </div>
        <div className='flex flex-col gap-1'>
          <TextHeading>Lock Value</TextHeading>
          <TextHeading className='text-neutral-300'>{formatAmount(voting_amount)}</TextHeading>
          <Paragraph className='text-sm text-neutral-500'>${formatAmount(voting_amount * prices.THE)}</Paragraph>
        </div>
        <div className='flex flex-col gap-1'>
          <TextHeading>Locked Amount</TextHeading>
          <TextHeading className='text-neutral-300'>{formatAmount(amount)}</TextHeading>
          <Paragraph className='text-sm text-neutral-500'>${formatAmount(amount * prices.THE)}</Paragraph>
        </div>
      </div>
    </Box>
  )
}

export default SelectedVeTHEID
