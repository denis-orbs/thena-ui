'use client'

import React from 'react'

import Loading from '@/app/loading'
import useWallet from '@/lib/wallets/useWallet'

import FollowingPage from '../FollowingPage'

function Following() {
  const { account } = useWallet()

  if (!account) {
    return <Loading />
  }

  return <FollowingPage account={account.toLowerCase()} />
}

export default Following
