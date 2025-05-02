'use client'

import React, { useContext, useMemo } from 'react'

import { rewardsContext } from '@/context/rewardsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import usePrices from '@/hooks/usePrices'
import { ZERO_VALUE } from '@/lib/utils'

import UserAssets from './Assets'
import HeaderRewards from './HeaderRewards'
import Overview from './Overview'
import DashboardProfile from './Profile'
import SpecialDivider from './SpecialDivider'
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
          {/* <NewTextSubHeading className='max-md:hidden'>{t('My Assets')}</NewTextSubHeading> */}
          <UserAssets />
        </div>
        <SpecialDivider />
        <Overview />
        <SpecialDivider />
        <div className='flex flex-col md:grid md:grid-cols-3 md:gap-4'>
          <div className='col-span-1'>
            <TheNFT />
          </div>
          <SpecialDivider className='max-md:mt-4' />
          <div className='md col-span-2'>
            <DashboardProfile />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
