'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useDibsRewarder } from '@/context/dibsRewarderContext'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

function Information({ dailyUserVolume, dailyTotalVolume, userTotalVolume }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { totalDailyRewardUsd, totalRewardCurrDay, totalUserEarned } = useDibsRewarder()
  const [countDown, setCountDown] = useState(0)
  const assets = useAssets()

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
    if (userTotalVolume && Array.isArray(userTotalVolume)) {
      return fromWei(new BigNumber(userTotalVolume[0].totalAmount).toNumber())
    }
    return 0
  }, [userTotalVolume])

  const yourEstimatedDailyRewardTotal = useMemo(() => {
    let rs = 0
    if (totalRewardCurrDay && totalRewardCurrDay.length) {
      rs = totalRewardCurrDay.reduce((accumulator, currentValue) => {
        let price = 1
        const asset = assets.find(assetItem => assetItem.symbol === currentValue.symbol)
        if (asset) {
          price = asset.price
        }
        return accumulator + currentValue.totalReward * price
      }, 0)
    }
    return rs
  }, [assets, totalRewardCurrDay])

  const array1 = useMemo(
    () => [
      {
        value: `$${formatAmount(fromWei(totalDailyRewardUsd))}`,
        label: 'Total daily rewards available',
        show: true,
      },
      {
        value: `$${formatAmount(dailyUserTradingVolume)}`,
        label: 'Your Daily Trading Volume',
        show: !!account,
      },
      {
        value:
          totalRewardCurrDay && totalRewardCurrDay.length ? (
            <div className='flex flex-row flex-wrap items-center gap-2'>
              <TextHeading className='max-w-full break-all text-xl lg:text-2xl'>
                ${formatAmount((yourEstimatedDailyRewardTotal * dailyUserTradingVolume) / dailyTotalTradingVolume)}
              </TextHeading>
              <TextSubHeading>
                {totalRewardCurrDay
                  .map(
                    item =>
                      `${
                        dailyTotalTradingVolume === 0
                          ? 0
                          : formatAmount((item.totalReward * dailyUserTradingVolume) / dailyTotalTradingVolume)
                      } ${item.symbol}`,
                  )
                  .join(', ')}
              </TextSubHeading>
            </div>
          ) : (
            0
          ),
        label: 'Your estimated daily rewards',
        show: !!account,
      },
    ],
    [
      account,
      dailyTotalTradingVolume,
      dailyUserTradingVolume,
      totalDailyRewardUsd,
      totalRewardCurrDay,
      yourEstimatedDailyRewardTotal,
    ],
  )

  const array2 = useMemo(
    () => [
      {
        value:
          hours || minutes || seconds
            ? (hours ? `${hours}h ` : '') +
              (minutes ? `${minutes}m ` : hours ? '0m' : '') +
              (seconds ? `${seconds}s` : minutes ? '0s' : '')
            : 0,
        label: 'Next rewards distribution',
        show: true,
      },
    ],
    [hours, minutes, seconds],
  )

  const array3 = useMemo(
    () => [
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
    [account, totalTradingVolume, totalUserEarned],
  )

  return (
    <div className='mb-8 grid grid-cols-2 gap-6 lg:grid-cols-3'>
      {array1.map((item, index) => (
        <Box key={index} className={item.show ? 'flex flex-col items-start gap-1' : 'hidden'}>
          <TextHeading className='max-w-full break-all text-xl lg:text-2xl'>{item.value}</TextHeading>
          <TextSubHeading>{t(item.label)}</TextSubHeading>
        </Box>
      ))}
      {array2.map((item, index) => (
        <Box key={index} className={item.show ? 'flex flex-col items-start gap-1' : 'hidden'}>
          <TextHeading className='max-w-full break-all text-xl lg:text-2xl'>{item.value}</TextHeading>
          <TextSubHeading>{t(item.label)}</TextSubHeading>
        </Box>
      ))}
      {array3.map((item, index) => (
        <Box key={index} className={item.show ? 'flex flex-col items-start gap-1' : 'hidden'}>
          <TextHeading className='max-w-full break-all text-xl lg:text-2xl'>{item.value}</TextHeading>
          <TextSubHeading>{t(item.label)}</TextSubHeading>
        </Box>
      ))}
    </div>
  )
}

export default Information
