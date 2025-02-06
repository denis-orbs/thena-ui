import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import Skeleton from '@/components/skeleton'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'

function SelectedVeTHEID({ veTHESelected }) {
  const t = useTranslations()
  if (!veTHESelected) {
    return <Skeleton className='h-full w-full' />
  }

  const { id, lockedEnd } = veTHESelected

  return (
    <Box>
      <h3 className='font-archia text-xl font-semibold lg:text-2xl'>{t('Selected veTHE ID')}</h3>
      <div className='mt-2 grid grid-cols-2 gap-6'>
        <div className='flex flex-col gap-1'>
          <TextHeading>veTHE ID</TextHeading>
          <TextSubHeading>{id}</TextSubHeading>
        </div>
        <div className='flex flex-col gap-1'>
          <TextHeading>Lock Expire</TextHeading>
          <TextSubHeading>{dayjs.unix(lockedEnd).format('MMM D, YYYY')}</TextSubHeading>
        </div>
        <div className='flex flex-col gap-1'>
          <TextHeading>Lock Value</TextHeading>
          <TextSubHeading>{formatAmount(0)} TODO</TextSubHeading>
        </div>
        <div className='flex flex-col gap-1'>
          <TextHeading>Locked Amount</TextHeading>
          <TextSubHeading>{formatAmount(0)} TODO</TextSubHeading>
        </div>
      </div>
    </Box>
  )
}

export default SelectedVeTHEID
