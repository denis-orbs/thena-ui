'use client'

import React from 'react'

import Loading from '@/app/loading'

import { Rewards } from './Rewards'

function Profile() {
  const address = {}
  if (!address) {
    return <Loading />
  }

  return <Rewards address={address} />
}

export default Profile
