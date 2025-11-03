'use client'

import React from 'react'

import BackButton from '@/components/buttons/BackButton'
import { CreatedChart } from '@/modules/ArenaAnalytics/CreatedChart'

function TCCreatedPage() {
  return (
    <div className='mt-10 flex flex-col gap-10'>
      <BackButton href='/arena/analytics' />
      <CreatedChart />
    </div>
  )
}

export default TCCreatedPage
