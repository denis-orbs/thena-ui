'use client'

import React from 'react'

import Loading from '@/app/loading'

import { ProfilePage } from './ProfilePage'

function Profile() {
  const address = {}
  if (!address) {
    return <Loading />
  }

  return <ProfilePage address={address} />
}

export default Profile
