'use client'

import { useQuery } from '@tanstack/react-query'
import React from 'react'

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

  const { data: dailyUserVolume } = useQuery({
    queryKey: ['getDailyUserVolume', currentDay],
    queryFn: () => fetchDataDailyVolume(account, String(currentDay), '0x0000000000000000000000000000000000000000'),
    refetchInterval: 30000,
    enabled: Boolean(currentDay),
    gcTime: 0,
  })

  const { data: dailyTotalVolume } = useQuery({
    queryKey: ['getDailyTotalVolume', currentDay],
    queryFn: () =>
      fetchDataDailyVolume(
        '0x0000000000000000000000000000000000000000',
        String(currentDay),
        '0x0000000000000000000000000000000000000000',
      ),
    refetchInterval: 30000,
    enabled: Boolean(currentDay),
    gcTime: 0,
  })

  const { data: totalVolume } = useQuery({
    queryKey: ['getTotalVolume'],
    queryFn: () => fetchDataTotalVolume(account, '0x0000000000000000000000000000000000000000'),
    refetchInterval: 30000,
    enabled: Boolean(account),
    gcTime: 0,
  })

  const { data: earnings } = useQuery({
    queryKey: ['getEarnings'],
    queryFn: () => fetchDataEarnings(account),
    refetchInterval: 30000,
    enabled: Boolean(account),
    gcTime: 0,
  })

  return (
    <div className='relative'>
      <Hero />
      <div className='relative z-30'>
        <TopBar />
        <Information dailyUserVolume={dailyUserVolume} dailyTotalVolume={dailyTotalVolume} totalVolume={totalVolume} />
        <YourEarning earnings={earnings} />
        <Work />
      </div>
    </div>
  )
}
