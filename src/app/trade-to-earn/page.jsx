'use client'

import React from 'react'
import useSWR from 'swr'

import { useDibsRewarder } from '@/context/dibsRewarderContext'
import useWallet from '@/lib/wallets/useWallet'
import { fetchDataDailyVolume, fetchDataEarnings, fetchDataTotalVolume } from '@/modules/TradeToEarn'

import Hero from './Hero'
import Information from './Information'
import TopBar from './TopBar'
import Work from './Work'
import YourEarning from './YourEarning'

// '0x0b33f44aa8cde53f4ac3bc427cb80ae1c0dfefd1' for test

export default function TradeToEarnPage() {
  const { account } = useWallet()
  const { currentDay } = useDibsRewarder()

  const { data: dailyVolume } = useSWR(
    Number(currentDay) ? 'getDailyVolume' : null,
    () => fetchDataDailyVolume(account, String(currentDay), '0x0000000000000000000000000000000000000000'),
    {},
  )

  const { data: totalVolume } = useSWR(
    'getTotalVolume',
    () => fetchDataTotalVolume(account, '0x0000000000000000000000000000000000000000'),
    {},
  )

  const { data: earnings } = useSWR('getEarnings', () => fetchDataEarnings(account), {})

  return (
    <div className='relative'>
      <Hero />
      <div className='relative z-30'>
        <TopBar />
        <Information dailyVolume={dailyVolume} totalVolume={totalVolume} />
        <YourEarning earnings={earnings} />
        <Work />
      </div>
    </div>
  )
}
