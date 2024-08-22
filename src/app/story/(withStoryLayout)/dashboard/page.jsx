'use client'

import React from 'react'

import Loading from '@/app/loading'
import { UserInfoContextProvider } from '@/context/campaignParticipantsContext'
import useWallet from '@/lib/wallets/useWallet'

import { ProfilePage } from './ProfilePage'

function Profile() {
  const { account } = useWallet()
  if (!account) {
    return <Loading />
  }

  return (
    <UserInfoContextProvider>
      <ProfilePage address={account.toLowerCase()} />
    </UserInfoContextProvider>
  )
}

export default Profile
