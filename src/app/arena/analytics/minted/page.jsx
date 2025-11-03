'use client'

import React from 'react'

import BackButton from '@/components/buttons/BackButton'
import { MintedChart } from '@/modules/ArenaAnalytics/MintedChart'

function MintedAnalyticPage() {
  return (
    <div className='mt-10 flex flex-col gap-4'>
      <BackButton href='/arena/analytics' />
      <MintedChart />
    </div>
  )
}

export default MintedAnalyticPage
