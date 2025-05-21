'use client'

import React, { useMemo, useState } from 'react'

import useWallet from '@/hooks/useWallet'

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
    <div className='flex flex-col gap-4'>
      <HeaderRewards totalUsd={totalUsd} account={account} />
      <div className='flex max-w-[1464px] flex-col gap-4 md:mx-8 md:mb-12 lg:mx-12 2xl:mx-auto 2xl:mb-[180px] 2xl:w-[1352px] 3xl:w-[1490px]'>
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
