'use client'

import React from 'react'

import BackButton from '@/components/buttons/BackButton'
import { VolumeChart } from '@/modules/ArenaAnalytics/VolumeChart'

function VolumeAnalyticPage() {
  return (
    <div className='mt-10 flex flex-col gap-4'>
      <BackButton href='/arena/analytics' />
      <VolumeChart />
    </div>
  )
}

export default VolumeAnalyticPage
