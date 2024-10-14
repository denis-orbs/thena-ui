'use client'

import { gql } from 'graphql-request'
import { isArray } from 'lodash'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { v4Client } from '@/lib/graphql'
import { formatAmount } from '@/lib/utils'

import MenuTab from './MenuTab'
import { RankElement } from './TopCompetition'

const V4_TOP_USER = gql`
  query V4_TOP_USER(
    $userId: String = ""
    $orderBy: TCParticipantRankOrderByType = totalPnlUSD_DESC
    $offset: Int = 0
    $limit: Int = 20
    $q: String = ""
    $period: TCParticipantRankPeriodType
  ) {
    tcParticipantRank(userId: $userId, orderBy: $orderBy, limit: $limit, offset: $offset, q: $q, period: $period) {
      pagination {
        totalCount
      }
      participantDetails {
        avatar
        competitionWon
        followerCount
        id
        totalPnlUSD
        rank
        totalROI
        tradeTCVolume
        username
        nameColor
      }
      results {
        avatar
        competitionWon
        followerCount
        id
        rank
        totalPnlUSD
        totalROI
        tradeTCVolume
        username
        nameColor
      }
    }
  }
`

const fetchUsers = async (userId, sort, userFilter, period, offset = 0, limit = 50) => {
  try {
    let orderBy = ''
    const isDesc = sort?.isDesc

    if (isDesc) {
      orderBy = 'totalPnlUSD_DESC'
    } else {
      orderBy = 'totalPnlUSD_ASC'
    }
    switch (sort?.value) {
      case 'totalPnlUSD':
        orderBy = isDesc ? 'totalPnlUSD_DESC' : 'totalPnlUSD_ASC'
        break

      case 'totalROI':
        orderBy = isDesc ? 'totalROI_DESC' : 'totalROI_ASC'
        break

      case 'tradeTCVolume':
        orderBy = isDesc ? 'tradeTCVolume_DESC' : 'tradeTCVolume_ASC'
        break

      case 'followerCount':
        orderBy = isDesc ? 'followerCount_DESC' : 'followerCount_ASC'
        break

      case 'competitionWon':
        orderBy = isDesc ? 'competitionWon_DESC' : 'competitionWon_ASC'
        break

      default:
        break
    }
    const { tcParticipantRank } = await v4Client.request(V4_TOP_USER, {
      userId,
      q: userFilter,
      orderBy,
      offset,
      limit,
      period,
    })
    return tcParticipantRank
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

const TAB_TITLE = {
  ALL_TIME: {
    title: 'All Time',
    period: null,
  },
  MONTHLY: {
    title: 'Monthly',
    period: 'monthly',
  },
  WEEKLY: {
    title: 'Weekly',
    period: 'weekly',
  },
}

function renderRowData(item) {
  return item
    ? {
        id: item.id,
        rank: <RankElement rank={item.rank} />,
        user: <UserProfileCard user={{ ...item, id: item.id }} showVerified={item?.isVerified} />,
        totalPnlUSD: (
          <Paragraph className={item.totalPnlUSD < 0 ? 'text-red-500' : item.totalPnlUSD > 0 ? 'text-green-500' : ''}>
            {item.totalPnlUSD < 0 ? '-' : item.totalPnlUSD > 0 ? '+' : ''} $
            {formatAmount(item.totalPnlUSD < 0 ? item.totalPnlUSD * -1 : item.totalPnlUSD)}
          </Paragraph>
        ),
        totalROI: (
          <Paragraph className={item.totalROI < 0 ? 'text-red-500' : item.totalROI > 0 ? 'text-green-500' : ''}>
            {item.totalROI < 0 ? '-' : item.totalROI > 0 ? '+' : ''}
            {formatAmount(item.totalROI < 0 ? item.totalROI * -1 : item.totalROI)}%
          </Paragraph>
        ),
        followerCount: <Paragraph>{formatAmount(item.followerCount)}</Paragraph>,
        tradeTCVolume: <Paragraph>${formatAmount(item.tradeTCVolume)}</Paragraph>,
        competitionWon: <Paragraph>{formatAmount(item.competitionWon)}</Paragraph>,
      }
    : undefined
}

function TopUser() {
  const { account } = useWallet()

  const pathname = usePathname()
  const isAll = pathname.includes('/users')
  const pageSize = useMemo(() => (isAll ? 50 : 20), [isAll])
  const searchParams = useSearchParams()
  const search = searchParams.get('search')

  const [activeTab, setActiveTab] = useState(
    searchParams.get('period')
      ? searchParams.get('period') === TAB_TITLE.MONTHLY.period
        ? TAB_TITLE.MONTHLY
        : TAB_TITLE.WEEKLY
      : TAB_TITLE.ALL_TIME,
  )
  const [period, setPeriod] = useState(searchParams.get('period'))
  const [rowDefault, setRowDefault] = useState()

  const sortOptions = useMemo(
    () => [
      {
        label: <span>Rank</span>,
        value: 'rank',
        width: 'w-[5%]',
        disabled: true,
      },
      {
        label: 'Thenian',
        value: 'user',
        width: 'w-[25%]',
        disabled: true,
      },
      {
        label: 'Total PnL (USD)',
        value: 'totalPnlUSD',
        width: 'w-[20%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Total ROI',
        value: 'totalROI',
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
        label: 'Total Trading Volume',
        value: 'tradeTCVolume',
        width: 'w-[15%]',
        disabled: false,
      },
      {
        label: 'Competitions Won',
        value: 'competitionWon',
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
    let filter = ''
    if (debounceSearch) {
      filter = debounceSearch
    }
    return filter
  }, [debounceSearch])

  const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])

  const { data: topUsers, isLoading } = useSWR(
    ['top users api', userFilter, sort, offset, pageSize, activeTab.period],
    () => fetchUsers(account?.toLowerCase() || '', sort, userFilter, period, offset, pageSize),
  )

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
      if (topUsers && Array.isArray(topUsers.results)) {
        setDataFetch(topUsers)

        const userDefault = topUsers?.participantDetails

        setRowDefault(renderRowData(userDefault))
      } else {
        setDataFetch([])
      }
    }
  }, [isLoading, topUsers])

  const topUsersFormatted = useMemo(() => {
    const arr = dataFetch?.results || []
    return arr
  }, [dataFetch])

  const finalData = useMemo(
    () => topUsersFormatted?.map(item => renderRowData(item)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(topUsersFormatted)],
  )

  const indexUser = useMemo(() => {
    let index = -1
    if (account && currentPage === 1 && !isLoading && isArray(dataFetch.results)) {
      const itemUserIndex = dataFetch.results.findIndex(item => item?.id?.toLowerCase() === account.toLowerCase())
      if (itemUserIndex !== -1) {
        index = itemUserIndex
      }
    }
    return index
  }, [account, currentPage, dataFetch.results, isLoading])

  const handleClickTab = useCallback(
    data => {
      const query = new URLSearchParams(searchParams.toString())
      setActiveTab(data)
      setPeriod(data.period)
      if (data.period) {
        query.set('period', data.period)
      } else {
        query.delete('period', undefined)
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
    },
    [page, pathname, router, searchParams],
  )

  const menuData = useMemo(
    () => [
      {
        title: t(TAB_TITLE.ALL_TIME.title),
        isActive: activeTab.title === TAB_TITLE.ALL_TIME.title,
        isLink: false,
        onClick: () => handleClickTab(TAB_TITLE.ALL_TIME),
      },
      {
        title: t(TAB_TITLE.MONTHLY.title),
        isActive: activeTab.title === TAB_TITLE.MONTHLY.title,
        isLink: false,
        onClick: () => handleClickTab(TAB_TITLE.MONTHLY),
      },
      {
        title: t(TAB_TITLE.WEEKLY.title),
        isActive: activeTab.title === TAB_TITLE.WEEKLY.title,
        isLink: false,
        onClick: () => handleClickTab(TAB_TITLE.WEEKLY),
      },
    ],
    [activeTab.title, handleClickTab, t],
  )

  return (
    <div className='col-span-12 lg:col-span-7'>
      <div className='flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between'>
        <MenuTab className='h-11' menuData={menuData} />
        <div className='flex flex-col gap-4 md:flex-row'>
          <SearchInput
            className='h-11 w-full md:w-[336px]'
            classNames={{ input: 'h-11' }}
            val={searchText}
            setVal={setSearchText}
          />
        </div>
      </div>
      <div className='border-gradient-secondary mt-6 rounded-xl p-px'>
        <Box>
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
            hightLightById={account?.toLowerCase()}
            bgHightLight='bg-white bg-opacity-5'
            loading={isLoading}
            pageSize={pageSize}
            totalItems={topUsers?.pagination?.totalCount || 0}
            limitPage={isAll ? undefined : 10}
            enabledRedirectOnClickSort
            showPopoverPagination={isAll}
            defaultHead={(indexUser > 49 || indexUser === -1) && currentPage === 1 ? rowDefault : undefined}
          />
        </Box>
      </div>
    </div>
  )
}

export default TopUser
