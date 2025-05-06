'use client'

import React, { useContext, useMemo } from 'react'

import { rewardsContext } from '@/context/rewardsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import usePrices from '@/hooks/usePrices'
import { ZERO_VALUE } from '@/lib/utils'

import UserAssets from './Assets'
import HeaderRewards from './HeaderRewards'
import ClaimableRewards from './Overview/ClaimableRewards'
import Lock from './Overview/Lock'
import Voting from './Overview/Voting'
import DashboardProfile from './Profile'
import SectionDivider from './SectionDivider'
import TheNFT from './theNFT'

function Dashboard() {
  const prices = usePrices()
  const { veTHEs } = useVeTHEsContext()
  const filteredVeTHEs = useMemo(() => veTHEs.filter(ele => ele.rebase_amount.gt(0)), [veTHEs])

  const { current } = useContext(rewardsContext)
  const { rewards: veRewardsV3 } = current
  const totalUsd = useMemo(() => {
    let total = [...veRewardsV3].reduce((sum, curr) => sum.plus(curr.totalUsd), ZERO_VALUE)
    filteredVeTHEs.forEach(ele => {
      total = total?.plus(ele?.rebase_amount?.times(prices.THE))
    })
    return total
  }, [veRewardsV3, filteredVeTHEs, prices.THE])
  return (
    <div className='flex flex-col gap-4'>
      <HeaderRewards totalUsd={totalUsd} />
      <div className='flex max-w-[1464px] flex-col gap-4 md:mx-8 md:mb-12 lg:mx-12 2xl:mx-auto 2xl:mb-[180px] 2xl:w-[1352px] 3xl:w-[1490px]'>
        <div className='flex flex-col rounded-xl max-md:bg-neutral-900 md:gap-2'>
          <UserAssets />
        </div>
        <SectionDivider />

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          <Voting />
          <ClaimableRewards />
          <Lock />
          <TheNFT />
          <DashboardProfile />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
