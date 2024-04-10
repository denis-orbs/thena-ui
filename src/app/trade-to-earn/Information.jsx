'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import { TextHeading, TextSubHeading } from '@/components/typography'
import useWallet from '@/lib/wallets/useWallet'

function Information({ dailyVolume, totalVolume }) {
  const t = useTranslations()
  const { account } = useWallet()

  const totalTradingVolume = useMemo(() => {
    if (totalVolume && Array.isArray(totalVolume)) {
      const sumWithInitial = totalVolume?.reduce(
        (accumulator, currentValue) => accumulator + (currentValue?.amountAsUser || 0),
        0,
      )
      return sumWithInitial
    }
    return 0
  }, [totalVolume])

  const data = useMemo(
    () => [
      {
        value: 19999,
        label: 'Total rewards for current epoch',
        show: !!account,
      },
      {
        value: dailyVolume?.amountAsUser || 0,
        label: 'Your Daily Trading Volume',
        show: !!account,
      },
      {
        value: 19999,
        label: 'Current Epoch Estimated reward',
        show: true,
      },
      {
        value: 19999,
        label: 'Daily epoch timer',
        show: true,
      },
      {
        value: totalTradingVolume,
        label: 'Your Total Trading Volume',
        show: !!account,
      },
      {
        value: 19999,
        label: 'Your Total Earnings',
        show: !!account,
      },
    ],
    [account, dailyVolume?.amountAsUser, totalTradingVolume],
  )

  return (
    <div className='mb-8 grid grid-cols-2 gap-6 lg:grid-cols-3'>
      {data.map((item, index) => (
        <Box key={index} className={item.show ? 'flex flex-col items-start gap-1' : 'hidden'}>
          <TextHeading className='text-xl lg:text-2xl'>${item.value.toLocaleString()}</TextHeading>
          <TextSubHeading>{t(item.label)}</TextSubHeading>
        </Box>
      ))}
    </div>
  )
}

export default Information
