'use client'

import { useParams } from 'next/navigation'
import React from 'react'

import Loading from '@/app/loading'

import FollowingPage from '../../FollowingPage'

function Following() {
  const { address } = useParams()

  if (!address) {
    return <Loading />
  }

  return <FollowingPage account={address?.toLowerCase()} />
}

export default Following
