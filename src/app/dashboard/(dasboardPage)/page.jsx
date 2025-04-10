'use client'

import React from 'react'

import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import useWallet from '@/hooks/useWallet'
import Dashboard from '@/modules/Dashboard'

import NotConnected from '../NotConnected'

function DashboardPage() {
  const { account } = useWallet()

  return (
    <LayoutWithBackButton className='!mt-0 max-md:!mx-0 md:!mt-4'>
      {account ? <Dashboard /> : <NotConnected />}
    </LayoutWithBackButton>
  )
}

export default DashboardPage
