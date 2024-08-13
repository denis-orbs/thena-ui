import { redirect } from 'next/navigation'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { useAssets } from '@/context/assetsContext'
import { fetchUserInfo } from '@/context/userInfoContext'

import { Process } from './Process'
import { UserInfo } from './UserInfo'

export function ProfilePage({ address }) {
  const decodedAddress = useMemo(() => decodeURIComponent(address), [address])

  const { data: userInfo, isLoading } = useSWR(['user info', address], () => fetchUserInfo(decodedAddress), {
    refreshInterval: 60000,
  })

  if (userInfo && userInfo.username && ![userInfo.username, userInfo.id].includes(decodedAddress)) {
    redirect(`/arena/profile/${decodeURIComponent(userInfo.username)}`)
  }

  const _assets = useAssets()

  if (isLoading || !userInfo) {
    return <Loading />
  }

  return (
    <div className='mt-10 space-y-10'>
      <UserInfo userInfo={userInfo} />
      <Process />
    </div>
  )
}
