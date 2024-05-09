'use client'

import React from 'react'

import Loading from '@/app/loading'
import useWallet from '@/lib/wallets/useWallet'

import FollowersPage from '../FollowersPage'

function Followers() {
  const { account } = useWallet()
  if (!account) {
    return <Loading />
  }

  return <FollowersPage account={account.toLowerCase()} />
}

export default Followers
