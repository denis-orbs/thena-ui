'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import SearchInput from '@/components/input/SearchInput'
import Skeleton from '@/components/skeleton'
import { TextHeading } from '@/components/typography'

import { FollowedProfileItem } from './FollowedProfileItem'

export function FollowedProfiles({ followingUsers, isFollower = false }) {
  const t = useTranslations()
  const [searchText, setSearchText] = useState('')

  const filterFollowingUsers = useMemo(
    () =>
      !searchText.trim().length
        ? followingUsers
        : followingUsers.filter(item => item.id?.toLowerCase().includes(searchText.toLowerCase())),
    [followingUsers, searchText],
  )

  return (
    <div className='space-y-4'>
      <div className='flex flex-col items-start justify-between lg:flex-row lg:items-center'>
        <TextHeading className='flex-2 text-xl'>
          {t(isFollower ? 'Follower Profiles' : 'Followed Profiles')}
        </TextHeading>
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
        {filterFollowingUsers
          ? filterFollowingUsers.map((item, index) => <FollowedProfileItem key={index} user={item} />)
          : new Array(8).fill(0).map(() => <Skeleton className='h-[279px] w-full' />)}
      </div>
    </div>
  )
}
