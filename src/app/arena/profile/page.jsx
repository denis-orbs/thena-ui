'use client'

import React, { useEffect } from 'react'

import Loading from '@/app/loading'
import useWallet from '@/hooks/useWallet'
import { useCheckUserCreated } from '@/modules/Arena/hooks/profile'

import { ProfilePage } from './ProfilePage'

function Profile() {
  const { account } = useWallet()
  const { checkUserCreated } = useCheckUserCreated()

  useEffect(() => {
    if (account) {
      checkUserCreated(account?.toLowerCase())
    }
  }, [account, checkUserCreated])

  if (!account) {
    return <Loading />
  }

  return <ProfilePage address={account.toLowerCase()} />
}

export default Profile
