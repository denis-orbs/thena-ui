import React from 'react'

import Loading from '@/app/loading'

import { Process } from './Process'
import { UserInfo } from './UserInfo'

const userInfo = {
  id: '0xb095069bdeb6be079206cb0a7cca2786d79cba7c',
  avatar: null,
  rank: 25300,
  firstInteractAt: '2024-08-08',
}

export function ProfilePage({ address }) {
  if (!address || !userInfo) {
    return <Loading />
  }

  return (
    <div className='mt-10 space-y-10'>
      <UserInfo userInfo={userInfo} />
      <Process />
    </div>
  )
}
