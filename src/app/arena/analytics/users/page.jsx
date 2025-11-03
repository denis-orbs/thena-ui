'use client'

import React from 'react'

import BackButton from '@/components/buttons/BackButton'
import UserChart from '@/modules/ArenaAnalytics/UserChart'

function UserAnalyticPage() {
  return (
    <div className='mt-10 flex flex-col gap-4'>
      <BackButton href='/arena/analytics' />
      <UserChart />
    </div>
  )
}

export default UserAnalyticPage
