'use client'

import React from 'react'

import Loading from '@/app/loading'
import useWallet from '@/hooks/useWallet'

import { Referral } from './Referral'
import { useTHEStory } from '../../provider'

function ReferralPage() {
  const { account } = useWallet()
  const { campaignParticipantInfo: userInfo } = useTHEStory()

  if (!account || !userInfo) {
    return <Loading />
  }

  return <Referral address={account.toLowerCase()} />
}

export default ReferralPage
