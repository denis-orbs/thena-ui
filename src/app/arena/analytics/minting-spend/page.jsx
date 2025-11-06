'use client'

import React from 'react'

import BackButton from '@/components/buttons/BackButton'
import { MintingSpendChart } from '@/modules/ArenaAnalytics/MintingSpendChart'

function MintingSpendAnalyticPage() {
  return (
    <div className='mt-10 flex flex-col gap-4'>
      <BackButton href='/arena/analytics' />
      <MintingSpendChart />
    </div>
  )
}
export default MintingSpendAnalyticPage
