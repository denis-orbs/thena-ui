'use client'

import React from 'react'

import BackButton from '@/components/buttons/BackButton'
import { EntryFeeChart } from '@/modules/ArenaAnalytics/EntryFeeChart'

function EntryFeePage() {
  return (
    <div className='mt-10 flex flex-col gap-4'>
      <BackButton href='/arena/analytics' />
      <EntryFeeChart />
    </div>
  )
}

export default EntryFeePage
