'use client'

import React from 'react'

import Hero from './Hero'
import Information from './Information'
import TopBar from './TopBar'
import Work from './Work'
import YourEarning from './YourEarning'

export default function TradeToEarnPage() {
  return (
    <div className='relative'>
      <Hero />
      <div className='relative z-30'>
        <TopBar />
        <Information />
        <YourEarning />
        <Work />
      </div>
    </div>
  )
}
