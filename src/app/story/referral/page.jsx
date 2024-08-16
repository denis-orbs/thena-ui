'use client'

import React from 'react'

import Loading from '@/app/loading'

import { Referral } from './Referral'

function Profile() {
  const address = {}
  if (!address) {
    return <Loading />
  }

  return <Referral address={address} />
}

export default Profile
