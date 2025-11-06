import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading } from '@/components/typography'
import usePrices from '@/hooks/usePrices'
import InfoIcon from '@/icons/InfoIcon'
import { cn, formatAmount } from '@/lib/utils'

function SelectedVeTHEID({ veTHESelected }) {
  const t = useTranslations()
  const prices = usePrices()

  const [show, setShow] = useState(false)

  if (!veTHESelected) {
    return <Skeleton className='h-full w-full' />
  }

  const { id, lockedEnd, voting_amount, amount } = veTHESelected

  return (
    <div className='rounded-xl lg:bg-neutral-900 lg:p-4'>
      <div className='flex items-center justify-between'>
        <h3 className='font-archia text-xl font-semibold lg:text-2xl'>{t('Selected veTHE [ID]', { id })}</h3>
        <div className='flex items-center lg:hidden'>
          <i
            onClick={() => setShow(!show)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8',
              show ? 'bg-neutral-600' : 'bg-neutral-900',
            )}
          >
            <InfoIcon />
          </i>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 0, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='overflow-hidden'
      >
        <div className={cn('flex flex-col rounded-xl bg-neutral-900 p-4 lg:hidden', show ? 'mt-4' : '')}>
          <Paragraph>{`${t('Lock Exprire')}: ${dayjs.unix(lockedEnd).format('MMM D, YYYY')}`}</Paragraph>
          <Paragraph>
            {`${t('Lock Value')}: ${formatAmount(voting_amount)} $${formatAmount(voting_amount * prices.THE)}`}
          </Paragraph>
          <Paragraph>
            {`${t('Locked Amount')}: ${formatAmount(amount)} $${formatAmount(amount * prices.THE)}`}
          </Paragraph>
        </div>
      </motion.div>
      <div className='hidden grid-cols-2 gap-6 lg:mt-2 lg:grid'>
        <div className='flex flex-col gap-1'>
          <TextHeading>veTHE ID</TextHeading>
          <TextHeading className='text-neutral-300'>{id}</TextHeading>
        </div>
        <div className='flex flex-col gap-1'>
          <TextHeading>{t('Lock Expire')}</TextHeading>
          <TextHeading className='text-neutral-300'>{dayjs.unix(lockedEnd).format('MMM D, YYYY')}</TextHeading>
        </div>
        <div className='flex flex-col gap-1'>
          <TextHeading>{t('Lock Value')}</TextHeading>
          <TextHeading className='text-neutral-300'>{formatAmount(voting_amount)}</TextHeading>
          <Paragraph className='text-sm text-neutral-500'>${formatAmount(voting_amount * prices.THE)}</Paragraph>
        </div>
        <div className='flex flex-col gap-1'>
          <TextHeading>{t('Locked Amount')}</TextHeading>
          <TextHeading className='text-neutral-300'>{formatAmount(amount)}</TextHeading>
          <Paragraph className='text-sm text-neutral-500'>${formatAmount(amount * prices.THE)}</Paragraph>
        </div>
      </div>
    </div>
  )
}

export default SelectedVeTHEID
