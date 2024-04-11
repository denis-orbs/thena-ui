'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useDibsRewarder } from '@/context/dibsRewarderContext'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

function Information({ dailyUserVolume, dailyTotalVolume, totalVolume }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { totalReward, totalRewardThenaCurrDay, totalUserEarned } = useDibsRewarder()
  const [countDown, setCountDown] = useState(0)

  const hours = useMemo(
    () => (countDown ? Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : 0),
    [countDown],
  )
  const minutes = useMemo(() => (countDown ? Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60)) : 0), [countDown])
  const seconds = useMemo(() => (countDown ? Math.floor((countDown % (1000 * 60)) / 1000) : 0), [countDown])

  useEffect(() => {
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setUTCHours(23, 59, 59, 999)
    const remainingTime = endOfDay - now
    const interval = setInterval(() => {
      setCountDown(remainingTime)
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [new Date().getTime()])

  const dailyUserTradingVolume = useMemo(() => {
    if (dailyUserVolume && dailyUserVolume.length) {
      return fromWei(dailyUserVolume[0].amountAsUser).toNumber()
    }
    return 0
  }, [dailyUserVolume])

  const dailyTotalTradingVolume = useMemo(() => {
    if (dailyTotalVolume && dailyTotalVolume.length) {
      return fromWei(dailyTotalVolume[0].amountAsUser).toNumber()
    }
    return 0
  }, [dailyTotalVolume])

  const totalTradingVolume = useMemo(() => {
    let rs = 0
    if (totalVolume && Array.isArray(totalVolume) && totalVolume.length) {
      rs = totalVolume?.reduce(
        (accumulator, currentValue) =>
          new BigNumber(accumulator).toNumber() + new BigNumber(currentValue?.amountAsUser || 0).toNumber(),
        0,
      )
    }
    return fromWei(rs)
  }, [totalVolume])

  const data = useMemo(
    () => [
      {
        value: `$${formatAmount(fromWei(totalReward))}`,
        label: 'Total rewards for current epoch',
        show: true,
      },
      {
        value: `$${formatAmount(dailyUserTradingVolume)}`,
        label: 'Your Daily Trading Volume',
        show: !!account,
      },
      {
        value: `${
          dailyTotalTradingVolume === 0
            ? 0
            : (formatAmount(totalRewardThenaCurrDay) * dailyUserTradingVolume) / dailyTotalTradingVolume
        } THE`,
        label: 'Current Epoch Estimated reward',
        show: true,
      },
      {
        value:
          hours || minutes || seconds
            ? (hours ? `${hours}h ` : '') +
              (minutes ? `${minutes}m ` : seconds ? '0m' : '') +
              (seconds ? `${seconds}s` : '')
            : 0,
        label: 'Daily epoch timer',
        show: true,
      },
      {
        value: `$${formatAmount(totalTradingVolume)}`,
        label: 'Your Total Trading Volume',
        show: !!account,
      },
      {
        value: `$${formatAmount(totalUserEarned)}`,
        label: 'Your Total Earnings',
        show: !!account,
      },
    ],
    [
      account,
      dailyTotalTradingVolume,
      dailyUserTradingVolume,
      hours,
      minutes,
      seconds,
      totalReward,
      totalRewardThenaCurrDay,
      totalTradingVolume,
      totalUserEarned,
    ],
  )

  return (
    <div className='mb-8 grid grid-cols-2 gap-6 lg:grid-cols-3'>
      {data.map((item, index) => (
        <Box key={index} className={item.show ? 'flex flex-col items-start gap-1' : 'hidden'}>
          <TextHeading className='max-w-full break-all text-xl lg:text-2xl'>{item.value}</TextHeading>
          <TextSubHeading>{t(item.label)}</TextSubHeading>
        </Box>
      ))}
    </div>
  )
}

export default Information
