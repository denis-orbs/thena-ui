'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useDibsRewarder } from '@/context/dibsRewarderContext'
import useWallet from '@/hooks/useWallet'
import { formatAmount } from '@/lib/utils'

function Information({ userDailyVolume, userTotalVolume }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { totalUserEarned } = useDibsRewarder()

  const array1 = useMemo(
    () => [
      {
        value: `$${formatAmount(userDailyVolume)}`,
        label: 'Your Daily Trading Volume',
        show: Boolean(account),
      },
    ],
    [account, userDailyVolume],
  )

  const array2 = useMemo(
    () => [
      {
        value: `$${formatAmount(userTotalVolume)}`,
        label: 'Your Total Trading Volume',
        show: Boolean(account),
      },
      {
        value: `$${formatAmount(totalUserEarned)}`,
        label: 'Your Total Earnings',
        show: Boolean(account),
      },
    ],
    [account, userTotalVolume, totalUserEarned],
  )

  return (
    <div className='mb-8 grid grid-cols-2 gap-6 lg:grid-cols-3'>
      {array1.map((item, index) => (
        <Box key={index} className={item.show ? 'flex flex-col items-start gap-1' : 'hidden'}>
          <TextHeading className='max-w-full text-xl break-all lg:text-2xl'>{item.value}</TextHeading>
          <TextSubHeading>{t(item.label)}</TextSubHeading>
        </Box>
      ))}
      {array2.map((item, index) => (
        <Box key={index} className={item.show ? 'flex flex-col items-start gap-1' : 'hidden'}>
          <TextHeading className='max-w-full text-xl break-all lg:text-2xl'>{item.value}</TextHeading>
          <TextSubHeading>{t(item.label)}</TextSubHeading>
        </Box>
      ))}
    </div>
  )
}

export default Information
