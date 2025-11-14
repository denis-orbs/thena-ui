'use client'

import React from 'react'

import Loading from '@/app/loading'
import useWallet from '@/hooks/useWallet'

import { Rewards } from './Rewards'
import { useTHEStory } from '../../provider'

function RewardPage() {
  const { account } = useWallet()
  const { campaignParticipantInfo: userInfo } = useTHEStory()

  if (!account || !userInfo) {
    return <Loading />
  }

  return <Rewards address={account.toLowerCase()} />
}

export default RewardPage
