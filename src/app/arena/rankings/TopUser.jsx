'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
      tradeTCVolume
      followingCount
      followerCount
      entryFeesPaid
      rankBalance
      rankTCVolume
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
    const orderBy = []
    const isDesc = sort?.isDesc

    if (isDesc) {
      orderBy.push('user_id_DESC')
    } else {
      orderBy.push('user_id_ASC')
    }
    switch (sort?.value) {
      case 'tradeTCVolume':
        orderBy.unshift(isDesc ? 'tradeTCVolume_DESC' : 'tradeTCVolume_ASC')
        break

      case 'balance':
        orderBy.unshift(isDesc ? 'user_balance_DESC' : 'user_balance_ASC')
        break

      case 'totalPnLUSD':
        orderBy.unshift(isDesc ? 'totalPnLUSD_DESC' : 'totalPnLUSD_ASC')
        break

      case 'totalWinAmountUSD':
        orderBy.unshift(isDesc ? 'totalWinAmountUSD_DESC' : 'totalWinAmountUSD_ASC')
        break

      case 'followingCount':
        orderBy.unshift(isDesc ? 'followingCount_DESC' : 'followingCount_ASC')
        break

      case 'followerCount':
        orderBy.unshift(isDesc ? 'followerCount_DESC' : 'followerCount_ASC')
        break

      case 'entryFeesPaid':
        orderBy.unshift(isDesc ? 'entryFeesPaid_DESC' : 'entryFeesPaid_ASC')
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
  const search = searchParams.get('search')

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
        width: 'w-[25%]',
        disabled: true,
      },
      {
        label: 'Total Trading Volume',
        value: 'tradeTCVolume',
        width: 'w-[20%]',
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
        width: 'w-[15%]',
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
        width: 'w-[15%]',
        isDesc: true,
        disabled: false,
      },
    ],
    [],
  )

  const t = useTranslations()
  const [searchText, setSearchText] = useState(search || '')
  const { page } = useParams()
  const [currentPage, setCurrentPage] = useState(page ? Number(page) : 1)
  const sortDefault = useMemo(() => {
    if (searchParams.get('sort')) {
      const sortParams = searchParams.get('sort')
      const isDescParams = searchParams.get('isDesc')
      const sortOption = sortOptions.find(item => item.value === sortParams)
      return {
        ...sortOption,
        isDesc: isDescParams === 'true',
      }
    }
    return sortOptions[2]
  }, [searchParams, sortOptions])

  const [sort, setSort] = useState(sortDefault)
  const [dataFetch, setDataFetch] = useState([])
  const [initialRender, setInitialRender] = useState(true)
  const router = useRouter()

  const debounceSearch = useDebounce(searchText.trim(), 300)

  const userFilter = useMemo(() => {
    let filter = {
      id_not_in: ['0x000000000000000000000000000000000000dead', '0x0000000000000000000000000000000000000000'],
    }
    if (debounceSearch) {
      filter = {
        AND: [
          { ...filter },
          {
            OR: [{ id_containsInsensitive: debounceSearch }, { username_containsInsensitive: debounceSearch }],
          },
        ],
      }
    }
    return filter
  }, [debounceSearch])

  const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])

  const { data: topUsers, isLoading } = useSWR(['top users api', userFilter, sort, offset, pageSize], () =>
    fetchUsers(sort, userFilter, offset, pageSize),
  )
  const { data: usersTotalCount } = useSWR(['total users api', debounceSearch], () => fetchTotalCount(debounceSearch))

  useEffect(() => {
    if (!initialRender) {
      setCurrentPage(1)
      const query = new URLSearchParams(searchParams.toString())
      if (debounceSearch) {
        query.set('search', debounceSearch)
      } else {
        query.delete('search', undefined)
      }
      let pathNew = pathname
      if (page && page !== 1) {
        const pathnameReverse = pathname.split('').reverse()
        const i = pathnameReverse.findIndex(item => item === '/')
        if (i !== -1) {
          pathnameReverse.splice(0, i)
          pathNew = pathnameReverse.reverse().join('')
        }
      }
      router.replace(`${pathNew}?${query.toString()}`)
    } else {
      setInitialRender(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const topUsersFormatted = useMemo(() => {
    const arr = dataFetch.map((item, index) => ({
      username: item.user.username,
      userId: item.user.id,
      tradeTCVolume: item.tradeTCVolume,
      totalWinAmountUSD: item.totalWinAmountUSD,
      totalPnLUSD: item.totalPnLUSD,
      followingCount: item.followingCount,
      followerCount: item.followerCount,
      entryFeesPaid: item.entryFeesPaid,
      avatar: item.user?.avatar,
      nameColor: item.user.nameColor,
      isVerified: item.user.isVerified,
      verifyImage: item.user.checkMarkIcon,
      isAdmin: item.user.isAdmin,
      isSuperAdmin: item.user.isSuperAdmin,
      balance: item.user.balance,
      rank: (currentPage - 1) * pageSize + index + 1,
      rankBalance: item.rankBalance,
      rankTCVolume: item.rankTCVolume,
    }))
    return arr
  }, [currentPage, dataFetch, pageSize])

  const hightLightIndex = useMemo(() => {
    if (!isLoading) {
      if (rank) {
        if (topUsersFormatted) {
          const index = topUsersFormatted.findIndex(item =>
            sort?.value === 'tradeTCVolume'
              ? item.rankTCVolume === Number(rank)
              : sort?.value === 'balance'
                ? item.rankBalance === Number(rank)
                : item.rank === Number(rank),
          )

          if (index !== -1) {
            return index
          }
        }
      }
    }
  }, [isLoading, rank, sort?.value, topUsersFormatted])

  const finalData = useMemo(
    () =>
      topUsersFormatted?.map(item => ({
        rank: (
          <Paragraph>
            {sort?.value === 'tradeTCVolume'
              ? item.rankTCVolume
              : sort?.value === 'balance'
                ? item.rankBalance
                : item.rank}
          </Paragraph>
        ),
        user: <UserProfileCard user={{ ...item, id: item.userId }} showVerified={item?.isVerified} />,
        tradeTCVolume: <Paragraph>${formatAmount(item.tradeTCVolume)}</Paragraph>,
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
          // onlySortDesc
          enabledRedirectOnClickPagination
          loading={isLoading}
          pageSize={pageSize}
          totalItems={usersTotalCount || 0}
          limitPage={isAll ? undefined : 10}
          enabledRedirectOnClickSort
          hightLightIndex={hightLightIndex}
          showPopoverPagination={isAll}
        />
      </Box>
    </div>
  )
}

export default TopUser
