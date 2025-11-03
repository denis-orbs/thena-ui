'use client'

import React from 'react'

import BackButton from '@/components/buttons/BackButton'
import { FollowingChart } from '@/modules/ArenaAnalytics/FollowingChart'

function FollowingAnalyticPage() {
  return (
    <div className='mt-10 flex flex-col gap-4'>
      <BackButton href='/arena/analytics' />
      <FollowingChart />
    </div>
  )
}

export default FollowingAnalyticPage
