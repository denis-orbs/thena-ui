'use client'

import { useParams } from 'next/navigation'
import React from 'react'

import Loading from '@/app/loading'

import FollowersPage from '../../FollowersPage'

function Followers() {
  const { address } = useParams()

  if (!address) {
    return <Loading />
  }

  return <FollowersPage account={address?.toLowerCase()} />
}

export default Followers
