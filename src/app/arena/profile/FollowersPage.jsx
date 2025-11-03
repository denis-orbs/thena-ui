'use client'

import { useParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo } from 'react'
import useSWR from 'swr'

import BackButton from '@/components/buttons/BackButton'
import { fetchFollower } from '@/hooks/useUserFollow'

import { FollowedProfiles } from './FollowedProfiles'

function FollowersPage({ account }) {
  const params = useParams()

  const { data: followers, mutate: mutateFollower } = useSWR(
    ['followers', account?.toLowerCase()],
    () => fetchFollower(account?.toLowerCase()),
    {
      refreshInterval: 60000,
    },
  )

  const mutateData = useCallback(async () => {
    await mutateFollower()
  }, [mutateFollower])

  useEffect(() => {
    mutateData()
  }, [mutateData])

  const data = useMemo(() => followers?.map(item => ({ user: item.follower })), [followers])

  return (
    <div>
      <div className='sticky top-[128px] z-20 flex min-h-11 items-center justify-between bg-[#120916]/20 px-1 pt-4 pb-2 backdrop-blur-2xl lg:top-[150px] lg:mb-4 lg:pt-10'>
        <BackButton href={`/arena/profile${params?.address ? `/${params?.address}` : ''}`} />
      </div>
      <FollowedProfiles followingUsers={data} isFollower />
    </div>
  )
}

export default FollowersPage
