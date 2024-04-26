'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import Tabs from '@/components/tabs'
import { Paragraph } from '@/components/typography'
import { SizeTypes } from '@/constant/type'
import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'
import { formatAmount, sliceAddress } from '@/lib/utils'

const tabs = ['All', 'Hosted', 'Joined']
const tabsFilterTime = ['24h', '7d', '30d', 'Max']

// const V4_TOP_USER_ALL_WIN_AMOUNT_USD_DESC = gql`
//   query V4_TOP_USER_ALL_WIN_AMOUNT_USD_DESC {
//     tcParticipants(orderBy: winAmountUSD_DESC) {
//       participant {
//         avatar
//         id
//         nameColor
//         username
//       }
//       pnlUSD
//       winAmountUSD
//       tradingCompetition {
//         name
//         id
//       }
//     }
//   }
// `

const V4_TOP_USER_ALL_PNL_USD_DESC = gql`
  query V4_TOP_USER_ALL_PNL_USD_DESC {
    tcParticipants(orderBy: pnlUSD_DESC) {
      participant {
        avatar
        id
        nameColor
        username
      }
      pnlUSD
      winAmountUSD
      tradingCompetition {
        name
        id
      }
    }
  }
`

const fetchUsers = async () => {
  try {
    const { tcParticipants } = await v4Client.request(V4_TOP_USER_ALL_PNL_USD_DESC)
    return tcParticipants
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

function TopUser() {
  const sortOptions = useMemo(
    () => [
      {
        label: <span>#</span>,
        value: 'rank',
        width: 'w-[10%]',
        disabled: true,
      },
      {
        label: 'User',
        value: 'user',
        width: 'w-[20%]',
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
        disabled: true,
      },
      {
        label: 'Profit / Loss',
        value: 'pnlUSD',
        isDesc: true,
        disabled: true,
      },
    ],
    [],
  )

  const t = useTranslations()
  const [searchText, setSearchText] = useState('')
  const [selectedTab, setSelectedTab] = useState(tabs[0])
  const [selectedTabTime, setSelectedTabTime] = useState(tabsFilterTime[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[4])
  const [dataFetch, setDataFetch] = useState([])

  const debounceSearch = useDebounce(searchText.trim(), 300)

  const { data: topUsers, isLoading } = useSWR('top users api', () => fetchUsers())

  const subTabs = useMemo(
    () =>
      tabs.map(tab => ({
        label: t(tab),
        active: tab === selectedTab,
        onClickHandler: () => {
          setSelectedTab(tab)
        },
      })),
    [selectedTab, t],
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
    }))
    return arr
  }, [dataFetch])

  const topUserWithSearch = useMemo(() => {
    const arr = [...topUsersFormatted]
    if (debounceSearch) {
      return arr.filter(
        item =>
          item.username?.toLowerCase().includes(debounceSearch.toLowerCase()) ||
          item.userId.toLowerCase().includes(debounceSearch.toLowerCase()) ||
          item.competitionName.toLowerCase().includes(debounceSearch.toLowerCase()),
      )
    }
    return arr
  }, [debounceSearch, topUsersFormatted])

  useEffect(() => {
    setCurrentPage(1)
  }, [debounceSearch])

  const finalData = useMemo(
    () =>
      topUserWithSearch?.map((item, index) => ({
        rank: <Paragraph>{index + 1}</Paragraph>,
        user: (
          <Link
            className='flex cursor-pointer items-center justify-center gap-2'
            href={`/arena/profile/${item.userId.toLowerCase()}`}
          >
            <CircleImage src={Avatar} alt='avatar' className='size-8' />
            <Paragraph className='text-white'>{item.username || sliceAddress(item.userId)}</Paragraph>
          </Link>
        ),
        competitionName: (
          <Link
            className='max-w-[300px] truncate'
            href={`/arena/trading-competitions/${item.competitionId.toLowerCase()}`}
          >
            {item.competitionName}
          </Link>
        ),
        winAmountUSD: <Paragraph>${formatAmount(item.winAmountUSD)}</Paragraph>,
        pnlUSD: (
          <Paragraph className={item.pnlUSD < 0 ? 'text-red-500' : item.pnlUSD > 0 ? 'text-green-500' : ''}>
            {item.pnlUSD < 0 ? '-' : item.pnlUSD > 0 ? '+' : ''} $
            {item.pnlUSD < 0 ? formatAmount(item.pnlUSD * -1) : formatAmount(item.pnlUSD)}
          </Paragraph>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(topUserWithSearch)],
  )

  return (
    <div className='col-span-12 lg:col-span-7'>
      <div className='flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between'>
        <Tabs data={subTabs} size={SizeTypes.Medium} itemClassName='text-sm hidden' />
        <SearchInput
          className='h-11 w-full md:w-[336px]'
          classNames={{ input: 'h-11' }}
          val={searchText}
          setVal={setSearchText}
        />
      </div>
      <div className='mt-6 hidden flex-col items-start gap-3 md:flex-row md:items-center md:justify-between'>
        <div>select</div>
        <div className='hidden rounded-lg bg-neutral-900 p-1'>
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
        />
      </div>
    </div>
  )
}

export default TopUser
