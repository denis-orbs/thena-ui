'use client'

import React, { useMemo, useState } from 'react'

import useWallet from '@/hooks/useWallet'
import { cn } from '@/lib/utils'

import UserAssets from './Assets'
import HeaderRewards from './HeaderRewards'
import ClaimableRewards from './Overview/ClaimableRewards'
import Lock from './Overview/Lock'
import Voting from './Overview/Voting'
import DashboardProfile from './Profile'
import TheNFT from './theNFT'

function Dashboard() {
  const { account } = useWallet()

  const [positionRewards, setPositionRewards] = useState(0)
  const [claimableRewards, setClaimableRewards] = useState(0)

  const totalUsd = useMemo(() => positionRewards + claimableRewards, [claimableRewards, positionRewards])

  return (
    <div
      className={cn(
        'relative flex flex-col gap-4 overflow-hidden rounded-lg md:gap-[60px]',
        'bg-neutral-950 md:bg-gradient-to-b md:from-primary-950 md:to-zinc-900/10 md:shadow-[3px_6px_44px_0px_rgba(44,0,42,1.00)]',
      )}
    >
      <div
        className={cn(
          'absolute right-10 z-10 h-[120px] w-full max-md:right-0 md:h-[856px]',
          'bg-[url(/images/bg-dashboard.svg)] bg-contain bg-right-top bg-no-repeat max-md:bg-primary-950 max-md:bg-cover 3xl:bg-cover',
        )}
      />
      <div className='absolute top-0 z-20 h-[120px] w-full bg-[url(/images/pillars.svg)] bg-cover bg-right-top max-md:hidden md:h-[262px]' />

      <HeaderRewards totalUsd={totalUsd} account={account} />

      <div className='z-40 flex max-w-[1184px] flex-col gap-4 rounded-xl md:mx-8 md:mb-12 lg:mx-12 2xl:mx-auto 2xl:mb-[180px]'>
        {account && <UserAssets setPositionRewards={setPositionRewards} />}

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          <Voting />
          <ClaimableRewards setClaimableRewards={setClaimableRewards} />
          <Lock />
          <TheNFT />
          <DashboardProfile />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
