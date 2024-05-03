'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import Tabs from '@/components/tabs'
import { Paragraph } from '@/components/typography'
import { SizeTypes } from '@/constant/type'
import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'
import { formatAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

const tabsFilterUser = ['All', 'Hosted', 'Joined']
const tabsFilterTime = ['24h', '7d', '30d', 'Max']

const V4_TOP_USER = gql`
  query V4_TOP_USER($where: TCParticipantWhereInput = {}, $orderBy: [TCParticipantOrderByInput!] = []) {
    tcParticipants(orderBy: $orderBy, where: $where, limit: 25) {
      participant {
        id
        isVerified
        username
        nameColor
        avatar
        isAdmin
        isSuperAdmin
        checkMarkIcon
      }
      pnlUSD
      winAmountUSD
      tradingCompetition {
        name
        id
        timestamp {
          endTimestamp
        }
      }
    }
  }
`

const fetchUsers = async (sort, whereQuery) => {
  try {
    const { tcParticipants } = await v4Client.request(V4_TOP_USER, {
      where: whereQuery,
      orderBy: sort?.value === 'pnlUSD' ? ['pnl_DESC', 'id_ASC'] : ['winAmountUSD_DESC', 'id_ASC'],
    })
    return tcParticipants
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

function TopUser() {
  const { account } = useWallet()
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
        width: 'w-[15%]',
        disabled: true,
      },
      {
        label: 'Competition name',
        value: 'competitionName',
        width: 'w-[20%]',
        disabled: true,
      },
      {
        label: 'Win amount',
        value: 'winAmountUSD',
        width: 'w-[20%]',
        disabled: false,
      },
      {
        label: 'Profit & Loss',
        value: 'pnlUSD',
        isDesc: true,
        disabled: false,
      },
    ],
    [],
  )

  const t = useTranslations()
  const [searchText, setSearchText] = useState('')
  const [selectedTabUser, setSelectedTabUser] = useState(tabsFilterUser[0])
  const [selectedTabTime, setSelectedTabTime] = useState(tabsFilterTime[3])

  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[4])
  const [dataFetch, setDataFetch] = useState([])

  const debounceSearch = useDebounce(searchText.trim(), 300)

  const tradingCompetitionFilter = useMemo(() => {
    let filter = {}
    if (selectedTabTime !== 'Max') {
      switch (selectedTabTime) {
        case '24h':
          filter = {
            ...filter,
            timestamp: { endTimestamp_gte: Math.floor(Number(Date.now() / 1000 - 60 * 60 * 24)) },
          }
          break
        case '7d':
          filter = {
            ...filter,
            timestamp: { endTimestamp_gte: Math.floor(Date.now() / 1000 - 7 * 60 * 60 * 24) },
          }
          break
        case '30d':
          filter = {
            ...filter,
            timestamp: { endTimestamp_gte: Math.floor(Date.now() / 1000 - 30 * 60 * 60 * 24) },
          }
          break
        default:
          break
      }
    }

    if (account) {
      switch (selectedTabUser) {
        case 'Hosted':
          filter = {
            ...filter,
            owner: {
              id_eq: account.toLowerCase(),
            },
          }
          break
        case 'Joined':
          filter = {
            ...filter,
            participants_some: {
              participant: {
                id_eq: account.toLowerCase(),
              },
            },
          }
          break
        default:
          break
      }
    }
    return filter
  }, [selectedTabTime, account, selectedTabUser])

  const whereQuery = useMemo(() => {
    let where = {
      tradingCompetition: tradingCompetitionFilter,
    }

    if (debounceSearch) {
      where = {
        ...where,
        AND: {
          OR: [
            {
              participant: {
                OR: [{ id_containsInsensitive: debounceSearch }, { username_containsInsensitive: debounceSearch }],
              },
            },
            { tradingCompetition: { name_containsInsensitive: debounceSearch } },
          ],
        },
      }
    }

    return where
  }, [debounceSearch, tradingCompetitionFilter])

  const { data: topUsers, isLoading } = useSWR(['top users api', whereQuery, sort], () => fetchUsers(sort, whereQuery))

  const subTabsUser = useMemo(
    () =>
      tabsFilterUser.map(tab => ({
        label: t(tab),
        active: tab === selectedTabUser,
        onClickHandler: () => {
          setSelectedTabUser(tab)
        },
      })),
    [selectedTabUser, t],
  )

  const subTabsTime = useMemo(
    () =>
      tabsFilterTime.map(tab => ({
        label: t(tab),
        active: tab === selectedTabTime,
        onClickHandler: () => {
          setSelectedTabTime(tab)
        },
      })),
    [selectedTabTime, t],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [debounceSearch, selectedTabTime, selectedTabUser, sort])

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
    const arr = dataFetch.map(item => ({
      username: item.participant.username,
      userId: item.participant.id,
      competitionName: item.tradingCompetition.name,
      competitionId: item.tradingCompetition.id,
      winAmountUSD: item.winAmountUSD,
      pnlUSD: item.pnlUSD,
      avatar: item.participant.avatar || Avatar,
      nameColor: item.participant.nameColor,
      showVerified: item.participant.showVerified,
      verifyImage: item.participant.checkMarkIcon,
      isAdmin: item.participant.isAdmin,
      isSuperAdmin: item.participant.isSuperAdmin,
    }))
    return arr
  }, [dataFetch])

  const filteredTcParticipants = useMemo(() => {
    if (topUsersFormatted && Array.isArray(topUsersFormatted) && !topUsersFormatted.errors) {
      let rank = 0
      let arr = []
      if (sort?.value === 'pnlUSD') {
        let prevPnl = -99999999999

        arr = topUsersFormatted.map((item, index) => {
          if (item.pnlUSD !== prevPnl) {
            rank = index + 1
            prevPnl = item.pnlUSD
          }

          return {
            ...item,
            rank,
          }
        })
      } else {
        // Sort by Win Amount
        let prevWinAmount = -1

        arr = topUsersFormatted.map((item, index) => {
          if (item.winAmountUSD !== prevWinAmount) {
            rank = index + 1
            prevWinAmount = item.winAmountUSD
          }

          return {
            ...item,
            rank,
          }
        })
      }

      return arr
    }

    return []
  }, [sort?.value, topUsersFormatted])

  const finalData = useMemo(
    () =>
      filteredTcParticipants?.map(item => ({
        rank: <Paragraph>{item.rank}</Paragraph>,
        user: (
          <UserProfileCard
            avatar={item?.avatar}
            id={item?.userId}
            nameColor={item?.nameColor}
            showVerified={item?.isVerified}
            username={item?.username}
            verifyImage={item?.verifyImage}
            isAdmin={item.isAdmin}
            isSuperAdmin={item.isSuperAdmin}
          />
        ),
        competitionName: (
          <Link
            className='max-w-[250px] truncate'
            href={`/arena/trading-competitions/${item.competitionId.toLowerCase()}`}
          >
            {item.competitionName}
          </Link>
        ),
        winAmountUSD: <Paragraph>${formatAmount(item.winAmountUSD)}</Paragraph>,
        pnlUSD: (
          <Paragraph className={item.pnlUSD < 0 ? 'text-red-500' : item.pnlUSD > 0 ? 'text-green-500' : ''}>
            {item.pnlUSD < 0 ? '-' : item.pnlUSD > 0 ? '+' : ''} $
            {formatAmount(item.pnlUSD < 0 ? item.pnlUSD * -1 : item.pnlUSD)}
          </Paragraph>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filteredTcParticipants)],
  )

  return (
    <div className='col-span-12 lg:col-span-7'>
      <div className='flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between'>
        {account ? <Tabs data={subTabsUser} size={SizeTypes.Medium} itemClassName='text-sm' /> : null}
        <SearchInput
          className='h-11 w-full md:w-[336px]'
          classNames={{ input: 'h-11' }}
          val={searchText}
          setVal={setSearchText}
        />
      </div>
      <div className='mt-6 flex justify-end'>
        <div className='rounded-lg bg-neutral-900 p-1'>
          <Tabs data={subTabsTime} size={SizeTypes.Small} itemClassName='text-sm' />
        </div>
      </div>
      <div className='mt-6'>
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
        />
      </div>
    </div>
  )
}

export default TopUser
