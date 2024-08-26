'use client'

import React from 'react'

import Loading from '@/app/loading'
import { useTHEStory } from '@/context/THEStoryContext'
import useWallet from '@/lib/wallets/useWallet'

import { Referral } from './Referral'

function Profile() {
  const { account } = useWallet()
  const { campaignParticipantInfo: userInfo } = useTHEStory()

  if (!account || !userInfo) {
    return <Loading />
  }

  return <Referral address={account.toLowerCase()} />
}

export default Profile
