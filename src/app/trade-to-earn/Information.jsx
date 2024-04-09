import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { TextHeading, TextSubHeading } from '@/components/typography'

function Information() {
  const t = useTranslations()

  const data = [
    {
      value: 19999,
      label: 'Total rewards for current epoch',
    },
    {
      value: 19999,
      label: 'Your Daily Trading Volume',
    },
    {
      value: 19999,
      label: 'Current Epoch Estimated reward',
    },
    {
      value: 19999,
      label: 'Daily epoch timer',
    },
    {
      value: 19999,
      label: 'Your Total Trading Volume',
    },
    {
      value: 19999,
      label: 'Your Total Earnings',
    },
  ]

  return (
    <div className='mb-8 grid grid-cols-2 gap-6 lg:grid-cols-3'>
      {data.map((item, index) => (
        <Box key={index} className='flex flex-col items-start'>
          <TextHeading className='text-xl lg:text-2xl'>${item.value.toLocaleString()}</TextHeading>
          <TextSubHeading>{t(item.label)}</TextSubHeading>
        </Box>
      ))}
    </div>
  )
}

export default Information
