'use client'

import React from 'react'

import Loading from '@/app/loading'
import useWallet from '@/lib/wallets/useWallet'

import { ProfilePage } from './ProfilePage'

function Profile() {
  const { account } = useWallet()
  if (!account) {
    return <Loading />
  }

  return <ProfilePage address={account.toLowerCase()} />
}

export default Profile
