'use client'

import React from 'react'

import useWallet from '@/hooks/useWallet'
import Dashboard from '@/modules/Dashboard'

import NotConnected from './NotConnected'

function DashboardPage() {
  const { account } = useWallet()

  return <div className='layout-top mx-0 w-full'>{account ? <Dashboard /> : <NotConnected />}</div>
}

export default DashboardPage
