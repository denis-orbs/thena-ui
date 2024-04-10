'use client'

import React from 'react'
import useSWR from 'swr'

import useWallet from '@/lib/wallets/useWallet'
import { fetchDataDailyVolume, fetchDataTotalVolume } from '@/modules/TradeToEarn'

import Hero from './Hero'
import Information from './Information'
import TopBar from './TopBar'
import Work from './Work'
import YourEarning from './YourEarning'

export default function TradeToEarnPage() {
  const { account } = useWallet()
  const { data: dailyVolume } = useSWR(
    'getDailyVolume',
    () => fetchDataDailyVolume(account, '2', '0x0000000000000000000000000000000000000000'),
    {},
  )

  const { data: totalVolume } = useSWR(
    'getTotalVolume',
    () => fetchDataTotalVolume(account, '0x0000000000000000000000000000000000000000'),
    {},
  )

  return (
    <div className='relative'>
      <Hero />
      <div className='relative z-30'>
        <TopBar />
        <Information dailyVolume={dailyVolume} totalVolume={totalVolume} />
        <YourEarning />
        <Work />
      </div>
    </div>
  )
}
