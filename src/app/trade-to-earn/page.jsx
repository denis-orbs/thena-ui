'use client'

import { useQuery } from '@tanstack/react-query'
import React, { Suspense, useState } from 'react'

import { useDibsRewarder } from '@/context/dibsRewarderContext'
import useWallet from '@/lib/wallets/useWallet'
import { fetchDataDailyVolume, fetchDataTotalVolume } from '@/modules/TradeToEarn'

import Hero from './Hero'
import Information from './Information'
import TopBar from './TopBar'
import Work from './Work'
import YourEarning from './YourEarning'
import Loading from '../loading'

export default function TradeToEarnPage() {
  const { account } = useWallet()
  const { currentDay } = useDibsRewarder()

  const [pending, setPending] = useState(false)

  const { data: userDailyVolume } = useQuery({
    queryKey: ['getDailyUserVolume', currentDay, account],
    queryFn: () => fetchDataDailyVolume(account, String(currentDay), '0x0000000000000000000000000000000000000000'),
    refetchInterval: 30000,
    enabled: Boolean(account && currentDay),
    gcTime: 0,
  })

  const { data: totalDailyVolume } = useQuery({
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

  const { data: userTotalVolume } = useQuery({
    queryKey: ['getUserTotalVolume', account],
    queryFn: () => fetchDataTotalVolume(account?.toLowerCase()),
    refetchInterval: 30000,
    enabled: Boolean(account),
    gcTime: 0,
  })

  return (
    <section className='relative'>
      {pending && (
        <div className='absolute z-40 flex h-full w-full flex-col items-center justify-start gap-6 bg-[rgba(0,0,0,0.1)] pt-10 backdrop-blur-lg'>
          <Loading />
        </div>
      )}
      <div className='fixed left-0 right-0 mx-auto' />
      <div className='layout'>
        <Suspense fallback={<Loading />}>
          <div className='relative'>
            <Hero />
            <div className='relative z-30'>
              <TopBar />
              <Information
                userDailyVolume={userDailyVolume}
                totalDailyVolume={totalDailyVolume}
                userTotalVolume={userTotalVolume}
              />
              <YourEarning setPending={setPending} />
              <Work />
            </div>
          </div>
        </Suspense>
      </div>
    </section>
  )
}
