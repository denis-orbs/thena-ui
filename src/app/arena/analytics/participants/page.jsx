'use client'

import React from 'react'

import BackButton from '@/components/buttons/BackButton'
import { ParticipantChart } from '@/modules/ArenaAnalytics/ParticipantChart'

function ParticipantAnalyticPage() {
  return (
    <div className='mt-10 flex flex-col gap-4'>
      <BackButton href='/arena/analytics' />
      <ParticipantChart />
    </div>
  )
}

export default ParticipantAnalyticPage
