'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'
import { formatAmount, fromWei } from '@/lib/utils'

const V4_TOP_USER = gql`
  query V4_TOP_USER(
    $user: UserWhereInput = {}
    $orderBy: [UserLeaderboardOrderByInput!] = user_id_DESC
    $offset: Int = 0
    $limit: Int = 20
  ) {
    userLeaderboards(limit: $limit, orderBy: $orderBy, where: { user: $user }, offset: $offset) {
      totalPnLUSD
      totalWinAmountUSD
      tradeVolume
      followingCount
      followerCount
      entryFeesPaid
      rankBalance
      rankVolume
      user {
        username
        id
        nameColor
        avatar
        isAdmin
        isSuperAdmin
        checkMarkIcon
        verifiedAt
        balance
      }
    }
  }
`

const V4_TOTAL_USERS = gql`
  query V4_TOTAL_USERS($q: String = "") {
    usersTotalCount(q: $q)
  }
`

const fetchUsers = async (sort, userFilter, offset = 0, limit = 50) => {
  try {
    const orderBy = ['user_id_DESC']
    switch (sort?.value) {
      case 'tradeVolume':
        orderBy.unshift('tradeVolume_DESC')
        break

      case 'balance':
        orderBy.unshift('user_balance_DESC')
        break

      case 'totalPnLUSD':
        orderBy.unshift('totalPnLUSD_DESC')
        break

      case 'totalWinAmountUSD':
        orderBy.unshift('totalWinAmountUSD_DESC')
        break

      case 'followingCount':
        orderBy.unshift('followingCount_DESC')
        break

      case 'followerCount':
        orderBy.unshift('followerCount_DESC')
        break

      case 'entryFeesPaid':
        orderBy.unshift('entryFeesPaid_DESC')
        break

      default:
        break
    }
    const { userLeaderboards } = await v4Client.request(V4_TOP_USER, {
      user: userFilter,
      orderBy,
      offset,
      limit,
    })
    return userLeaderboards
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

const fetchTotalCount = async query => {
  try {
    const { usersTotalCount } = await v4Client.request(V4_TOTAL_USERS, {
      q: query,
    })
    return usersTotalCount
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

function TopUser() {
  const pathname = usePathname()
  const isAll = pathname.includes('/users')
  const pageSize = useMemo(() => (isAll ? 50 : 20), [isAll])
  const searchParams = useSearchParams()
  const rank = searchParams.get('rank')

  const sortOptions = useMemo(
    () => [
      {
        label: <span>#</span>,
        value: 'rank',
        width: 'w-[5%]',
        disabled: true,
      },
      {
        label: 'User',
        value: 'user',
        width: 'w-[20%]',
        disabled: true,
      },
      {
        label: 'Total Trading Volume',
        value: 'tradeVolume',
        width: 'w-[20%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Total THE balance',
        value: 'balance',
        width: 'w-[15%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Followings',
        value: 'followingCount',
        width: 'w-[10%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Followers',
        value: 'followerCount',
        width: 'w-[10%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Win Amount',
        value: 'totalWinAmountUSD',
        width: 'w-[15%]',
        disabled: false,
      },
      {
        label: 'Profit & Loss',
        value: 'totalPnLUSD',
        width: 'w-[15%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Entry Fees Paid',
        value: 'entryFeesPaid',
        width: 'w-[10%]',
        isDesc: true,
        disabled: false,
      },
    ],
    [],
  )

  const t = useTranslations()
  const [searchText, setSearchText] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[2])
  const [dataFetch, setDataFetch] = useState([])

  const debounceSearch = useDebounce(searchText.trim(), 300)

  const userFilter = useMemo(() => {
    if (debounceSearch) {
      return {
        OR: [{ id_containsInsensitive: debounceSearch }, { username_containsInsensitive: debounceSearch }],
      }
    }

    return {}
  }, [debounceSearch])

  const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])

  const { data: topUsers, isLoading } = useSWR(['top users api', userFilter, sort, offset, pageSize], () =>
    fetchUsers(sort, userFilter, offset, pageSize),
  )
  const { data: usersTotalCount } = useSWR(['total users api', debounceSearch], () => fetchTotalCount(debounceSearch))

  useEffect(() => {
    setCurrentPage(1)
  }, [debounceSearch])

  useEffect(() => {
    if (!isLoading) {
      if (topUsers && Array.isArray(topUsers)) {
        setDataFetch(topUsers)
      } else {
        setDataFetch([])
      }
    }
  }, [isLoading, topUsers])

  useEffect(() => {
    const sortParams = searchParams.get('sort')
    if (sortParams) {
      switch (sortParams) {
        case 'tradeVolume':
          setSort({ label: 'Total Trading Volume', value: 'tradeVolume', isDesc: true })
          break
        case 'balance':
          setSort({ label: 'Total THE balance', value: 'balance', isDesc: true })
          break
        case 'totalPnLUSD':
          setSort({ label: 'Profit & Loss', value: 'totalPnLUSD', isDesc: true })
          break
        case 'totalWinAmountUSD':
          setSort({ label: 'Win Amount', value: 'totalWinAmountUSD', isDesc: true })
          break
        case 'followingCount':
          setSort({ label: 'Followings', value: 'followingCount', isDesc: true })
          break
        case 'followerCount':
          setSort({ label: 'Followers', value: 'followerCount', isDesc: true })
          break
        case 'entryFeesPaid':
          setSort({ label: 'Entry Fees Paid', value: 'entryFeesPaid', isDesc: true })
          break
        default:
          break
      }
    }
  }, [searchParams])

  const topUsersFormatted = useMemo(() => {
    const arr = dataFetch.map((item, index) => ({
      username: item.user.username,
      userId: item.user.id,
      tradeVolume: item.tradeVolume,
      totalWinAmountUSD: item.totalWinAmountUSD,
      totalPnLUSD: item.totalPnLUSD,
      followingCount: item.followingCount,
      followerCount: item.followerCount,
      entryFeesPaid: item.entryFeesPaid,
      avatar: item.user.avatar || Avatar,
      nameColor: item.user.nameColor,
      isVerified: item.user.isVerified,
      verifyImage: item.user.checkMarkIcon,
      isAdmin: item.user.isAdmin,
      isSuperAdmin: item.user.isSuperAdmin,
      balance: item.user.balance,
      rank: (currentPage - 1) * pageSize + index + 1,
      rankBalance: item.rankBalance,
      rankVolume: item.rankVolume,
    }))
    return arr
  }, [currentPage, dataFetch, pageSize])

  const hightLightIndex = useMemo(() => {
    if (rank) {
      if (topUsersFormatted) {
        const index = topUsersFormatted.findIndex(item => item.rank === Number(rank))
        return index
      }
    }
  }, [rank, topUsersFormatted])

  const finalData = useMemo(
    () =>
      topUsersFormatted?.map(item => ({
        rank: (
          <Paragraph>
            {sort?.value === 'tradeVolume' ? item.rankVolume : sort?.value === 'balance' ? item.rankBalance : item.rank}
          </Paragraph>
        ),
        user: <UserProfileCard user={{ ...item, id: item.userId }} showVerified={item?.isVerified} />,
        tradeVolume: <Paragraph>${formatAmount(item.tradeVolume)}</Paragraph>,
        balance: <Paragraph>{formatAmount(fromWei(item.balance))} THE</Paragraph>,
        followingCount: <Paragraph>{formatAmount(item.followingCount)}</Paragraph>,
        followerCount: <Paragraph>{formatAmount(item.followerCount)}</Paragraph>,
        totalWinAmountUSD: <Paragraph>${formatAmount(item.totalWinAmountUSD)}</Paragraph>,
        totalPnLUSD: (
          <Paragraph className={item.totalPnLUSD < 0 ? 'text-red-500' : item.totalPnLUSD > 0 ? 'text-green-500' : ''}>
            {item.totalPnLUSD < 0 ? '-' : item.totalPnLUSD > 0 ? '+' : ''} $
            {formatAmount(item.totalPnLUSD < 0 ? item.totalPnLUSD * -1 : item.totalPnLUSD)}
          </Paragraph>
        ),
        entryFeesPaid: <Paragraph>${formatAmount(item.entryFeesPaid)}</Paragraph>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(topUsersFormatted)],
  )

  return (
    <div className='col-span-12 lg:col-span-7'>
      <div className='flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between'>
        <SearchInput
          className='h-11 w-full md:w-[336px]'
          classNames={{ input: 'h-11' }}
          val={searchText}
          setVal={setSearchText}
        />
      </div>
      <Box className='mt-6'>
        <div className='flex flex-row items-center justify-between'>
          <TextHeading className='text-xl'>{t('Top Users')}</TextHeading>
          {!isAll && (
            <Link href='/arena/rankings/users'>
              <EmphasisButton>{t('View All')}</EmphasisButton>
            </Link>
          )}
        </div>
        <Table
          sort={sort}
          setSort={setSort}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          tableBasic
          data={finalData}
          sortOptions={sortOptions}
          onlySortDesc
          enabledRedirectOnClickPagination
          loading={isLoading}
          pageSize={pageSize}
          totalItems={usersTotalCount || 0}
          limitPage={isAll ? undefined : 10}
          enabledRedirectOnClickSort
          hightLightIndex={hightLightIndex}
        />
      </Box>
    </div>
  )
}

export default TopUser
