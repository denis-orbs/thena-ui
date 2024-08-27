'use client'

import React from 'react'

import Loading from '@/app/loading'
import { useTHEStory } from '@/context/THEStoryContext'
import useWallet from '@/lib/wallets/useWallet'

import { Rewards } from './Rewards'

function RewardPage() {
  const { account } = useWallet()
  const { campaignParticipantInfo: userInfo } = useTHEStory()

  if (!account || !userInfo) {
    return <Loading />
  }

  return <Rewards address={account.toLowerCase()} />
}

export default RewardPage
