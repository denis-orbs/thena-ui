'use client'

import React from 'react'

import BackButton from '@/components/buttons/BackButton'
import { PrizePoolChart } from '@/modules/ArenaAnalytics/PrizePoolChart'

function PrizePoolAnalyticPage() {
  return (
    <div className='mt-10 flex flex-col gap-4'>
      <BackButton href='/arena/analytics' />
      <PrizePoolChart />
    </div>
  )
}

export default PrizePoolAnalyticPage
