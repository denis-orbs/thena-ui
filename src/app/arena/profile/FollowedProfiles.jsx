'use client'

import { gql } from 'graphql-request'
import { useParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import SearchInput from '@/components/input/SearchInput'
import Skeleton from '@/components/skeleton'
import { TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
import { sliceAddress } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import { FollowedProfileItem } from './FollowedProfileItem'

const V4_USER_BY_ID_OR_USERNAME = gql`
  query GetUserByIdOrUsername($idOrUserName: String!) {
    users(
      where: {
        OR: [
          { username_eq: $idOrUserName }
          { id_eq: $idOrUserName }
          { usernameNfts_some: { name_eq: $idOrUserName } }
        ]
      }
      limit: 1
    ) {
      id
      username
    }
  }
`

const fetchUserInfo = async idOrUserName => {
  try {
    const { users } = await v4Client.request(
      V4_USER_BY_ID_OR_USERNAME,
      { idOrUserName: idOrUserName.toLowerCase() },
      {
        authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
      },
    )

    if (users.length === 1) {
      const user = users[0]

      return { ...user }
    }
    return undefined
  } catch (error) {
    return undefined
  }
}

export function FollowedProfiles({ followingUsers, isFollower = false }) {
  const t = useTranslations()
  const [searchText, setSearchText] = useState('')
  const { account } = useWallet()
  const { address } = useParams()
  const pathname = usePathname()
  const profilePage = !pathname.includes('follow')

  const { data: userInfo } = useSWR(
    ['user info in follow page', address || account],
    () => fetchUserInfo(address || account),
    {
      refreshInterval: 60000,
    },
  )

  const debounceSearch = useDebounce(searchText, 300)

  const filterFollowingUsers = useMemo(
    () =>
      !debounceSearch.trim().length
        ? followingUsers
        : followingUsers.filter(
            item =>
              item?.user?.id?.toLowerCase().includes(debounceSearch.toLowerCase()) ||
              item?.user?.username?.toLowerCase().includes(debounceSearch.toLowerCase()),
          ),
    [followingUsers, debounceSearch],
  )

  return (
    <div className='space-y-4'>
      <div className='flex flex-col items-start justify-between lg:flex-row lg:items-center'>
        <TextHeading className='flex-2 text-xl'>
          {t(isFollower ? 'Followers of' : profilePage ? 'Followed Profiles' : 'Following of', {
            user: userInfo?.username || sliceAddress(userInfo?.id),
          })}{' '}
          ({followingUsers?.length})
        </TextHeading>
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
        {filterFollowingUsers
          ? filterFollowingUsers.map((item, index) => <FollowedProfileItem key={index} user={item} />)
          : new Array(8).fill(0).map((_, index) => <Skeleton key={index} className='h-16 w-full' />)}
      </div>
    </div>
  )
}
