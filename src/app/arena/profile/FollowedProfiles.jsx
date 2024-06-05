'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { EmphasisButton } from '@/components/buttons/Button'
import SearchInput from '@/components/input/SearchInput'
import Skeleton from '@/components/skeleton'
import { TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'
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
    const { users } = await v4Client.request(V4_USER_BY_ID_OR_USERNAME, { idOrUserName: idOrUserName.toLowerCase() })

    if (users.length === 1) {
      const user = users[0]

      return { ...user }
    }
    return undefined
  } catch (error) {
    return undefined
  }
}

export function FollowedProfiles({ followingUsers, isFollower = false, maxShow, showViewFollowing = false }) {
  const t = useTranslations()
  const [searchText, setSearchText] = useState('')
  const { account } = useWallet()
  const { address } = useParams()
  const pathname = usePathname()
  const params = useParams()
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
        <div className='flex flex-2 items-center gap-2'>
          <TextHeading className='text-xl'>
            {t(isFollower ? 'Followers of' : profilePage ? 'Followed Profiles' : 'Following of', {
              user: userInfo?.username || sliceAddress(userInfo?.id),
            })}{' '}
            ({followingUsers?.length})
          </TextHeading>
          {showViewFollowing && filterFollowingUsers.length > 15 && (
            <Link href={`/arena/profile${params?.address ? `/${params?.address}` : ''}/following`}>
              <EmphasisButton>{t('View All')}</EmphasisButton>
            </Link>
          )}
        </div>
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4'>
        {filterFollowingUsers
          ? filterFollowingUsers
              .slice(0, maxShow ?? filterFollowingUsers.length)
              .map((item, index) => <FollowedProfileItem key={index} user={item} />)
          : new Array(8).fill(0).map((_, index) => <Skeleton key={index} className='h-16 w-full' />)}
      </div>
    </div>
  )
}
