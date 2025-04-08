'use client'

import React from 'react'

import useWallet from '@/hooks/useWallet'
import Dashboard from '@/modules/Dashboard'

import NotConnected from './NotConnected'

function DashboardPage() {
  const { account } = useWallet()

  return account ? <Dashboard /> : <NotConnected />
}

export default DashboardPage
