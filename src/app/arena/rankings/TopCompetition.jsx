'use client'

import { gql } from 'graphql-request'
import { isNil } from 'lodash'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'
import { formatAmount } from '@/lib/utils'
import { FirstPrizeIcon, SecondPrizeIcon, ThirdPrizeIcon } from '@/svgs'

import MenuTab from './MenuTab'

const V4_TOP_COMPETITIONS = gql`
  query V4_TOP_COMPETITIONS(
    $orderBy: [TradingCompetitionOrderByInput!] = []
    $market_eq: MarketType
    $name_containsInsensitive: String
  ) {
    tradingCompetitions(
      orderBy: $orderBy
      where: { market_eq: $market_eq, name_containsInsensitive: $name_containsInsensitive }
    ) {
      id
      tcTrades {
        amountUSD
      }
      participantCount
      name
      entryFeeUSD
      totalPrizeUSD
    }
  }
`

const fetchTopCompetition = async (sort, marketEq, search) => {
  try {
    const orderBy = ['id_ASC']
    const isDesc = sort?.isDesc
    switch (sort?.value) {
      case 'participants':
        orderBy.unshift(isDesc ? 'participantCount_DESC' : 'participantCount_ASC')
        break
      case 'entryFee':
        orderBy.unshift(isDesc ? 'entryFeeUSD_DESC' : 'entryFeeUSD_ASC')
        break
      case 'totalPrize':
        orderBy.unshift(isDesc ? 'totalPrizeUSD_DESC' : 'totalPrizeUSD_ASC')
        break
      case 'volume':
        orderBy.unshift(isDesc ? 'participantCount_DESC' : 'participantCount_ASC')
        break
      default:
        break
    }

    const { tradingCompetitions: topCompetition } = await v4Client.request(V4_TOP_COMPETITIONS, {
      orderBy,
      market_eq: marketEq,
      name_containsInsensitive: search,
    })
    return topCompetition
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

const TAB_TITLE = {
  ALL: 'All',
  SPOT: 'SPOT',
  PERPETUAL: 'PERPETUALS',
}

export function RankElement({ rank }) {
  switch (rank) {
    case 1: {
      return <FirstPrizeIcon className='size-7 md:size-9' />
    }
    case 2: {
      return <SecondPrizeIcon className='size-7 md:size-9' />
    }
    case 3: {
      return <ThirdPrizeIcon className='size-7 md:size-9' />
    }

    default: {
      return <p className='w-full text-center'>{isNil(rank) ? '-' : rank}</p>
    }
  }
}

function TopCompetition() {
  const pathname = usePathname()
  const isAll = pathname.includes('/competitions')
  const router = useRouter()
  const searchParams = useSearchParams()
  const marketType = searchParams.get('marketType')

  const search = searchParams.get('search')
  const [searchText, setSearchText] = useState(search || '')
  const debounceSearch = useDebounce(searchText.trim(), 300)

  const [activeTab, setActiveTab] = useState(
    marketType !== TAB_TITLE.ALL && marketType
      ? marketType === TAB_TITLE.PERPETUAL
        ? TAB_TITLE.PERPETUAL
        : TAB_TITLE.SPOT
      : TAB_TITLE.ALL,
  )

  const sortOptions = useMemo(
    () => [
      {
        label: <span>#</span>,
        value: 'rank',
        width: 'w-[5%]',
        disabled: true,
      },
      {
        label: 'Competition Name',
        value: 'competitionName',
        width: isAll ? 'w-[50%]' : 'w-[15%]',
        disabled: true,
      },
      {
        label: 'Total Prize',
        value: 'totalPrize',
        width: 'w-[20%]',
        isDesc: true,
      },
      {
        label: 'Participants',
        value: 'participants',
        width: 'w-[20%]',
        isDesc: true,
      },
      {
        label: 'Volume',
        value: 'volume',
        width: 'w-[20%]',
        isDesc: true,
      },
      {
        label: 'Entry Fee',
        value: 'entryFee',
        width: 'w-[20%]',
        isDesc: true,
      },
    ],
    [isAll],
  )
  const { page } = useParams()
  const [currentPage, setCurrentPage] = useState(!isAll ? 1 : page ? Number(page) : 1)
  const sortDefault = useMemo(() => {
    if (isAll && searchParams.get('sort')) {
      const sortParams = searchParams.get('sort')
      const isDescParams = searchParams.get('isDesc')
      const sortOption = sortOptions.find(item => item.value === sortParams)
      return {
        ...sortOption,
        isDesc: isDescParams === 'true',
      }
    }
    return sortOptions[3]
  }, [isAll, searchParams, sortOptions])

  const [sort, setSort] = useState(sortDefault)
  const [initialRender, setInitialRender] = useState(true)

  // const [direction, setDirection] = useState('DESC')

  const t = useTranslations()

  const searchFilter = useMemo(() => {
    let filter = ''
    if (debounceSearch) {
      filter = debounceSearch
    }
    return filter
  }, [debounceSearch])

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

  const { data: topTCRes, isLoading } = useSWR(
    ['top competition api', sort, activeTab, searchFilter],
    () => fetchTopCompetition(sort, activeTab === TAB_TITLE.ALL ? undefined : activeTab, searchFilter),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  )

  const calcTotalVolume = useCallback(comp => {
    let volume = 0

    comp.tcTrades.forEach(tcTrade => {
      volume += tcTrade.amountUSD
    })

    return volume
  }, [])

  const competitions = useMemo(() => {
    if (topTCRes && Array.isArray(topTCRes) && !topTCRes.errors) {
      let rank = 0
      let arr = []
      if (sort.value !== 'volume') {
        let prevCount = -1

        arr = topTCRes.map((item, index) => {
          const volume = calcTotalVolume(item)

          if (item.participantCount !== prevCount) {
            rank = index + 1
            prevCount = item.participantCount
          }

          return {
            rank,
            competitionName: item.name,
            participants: item.participantCount,
            volume,
            id: item.id,
            entryFee: item.entryFeeUSD,
            totalPrize: item.totalPrizeUSD,
          }
        })
      } else if (sort?.value === 'volume') {
        // Sort by Total Volume
        const temp = topTCRes.map(item => {
          const volume = calcTotalVolume(item)

          return {
            competitionName: item.name,
            participants: item.participantCount,
            volume,
            id: item.id,
            entryFee: item.entryFeeUSD,
            totalPrize: item.totalPrizeUSD,
          }
        })
        let prevVol = -1
        if (sort.isDesc) {
          temp.sort((a, b) => b.volume - a.volume)
        } else {
          temp.sort((a, b) => a.volume - b.volume)
        }
        arr = temp.map((item, index) => {
          if (item.volume !== prevVol) {
            rank = index + 1
            prevVol = item.volume
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
  }, [topTCRes, calcTotalVolume, sort.value, sort.isDesc])

  const finalData = useMemo(
    () =>
      competitions?.map(item => ({
        rank: <RankElement rank={item.rank} />,
        competitionName: (
          <Link
            href={`/arena/trading-competitions/${item.id}`}
            className={`max-w-[200px] truncate ${isAll ? 'md:max-w-[500px]' : 'md:max-w-[150px]'}`}
          >
            {item.competitionName}
          </Link>
        ),
        participants: <Paragraph>{item.participants}</Paragraph>,
        volume: <Paragraph>${formatAmount(item.volume)}</Paragraph>,
        entryFee: <Paragraph>${formatAmount(item.entryFee)}</Paragraph>,
        totalPrize: <Paragraph>${formatAmount(item.totalPrize)}</Paragraph>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(competitions)],
  )

  const onClickMenuTab = useCallback(
    data => {
      const query = new URLSearchParams(searchParams.toString())
      setActiveTab(data)
      query.set('marketType', data)

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
        title: t(TAB_TITLE.ALL),
        isActive: activeTab === TAB_TITLE.ALL,
        isLink: false,
        onClick: () => onClickMenuTab(TAB_TITLE.ALL),
      },
      {
        title: t(TAB_TITLE.SPOT),
        isActive: activeTab === TAB_TITLE.SPOT,
        isLink: false,
        onClick: () => onClickMenuTab(TAB_TITLE.SPOT),
      },
      {
        title: t(TAB_TITLE.PERPETUAL),
        isActive: activeTab === TAB_TITLE.PERPETUAL,
        isLink: false,
        onClick: () => onClickMenuTab(TAB_TITLE.PERPETUAL),
      },
    ],
    [activeTab, onClickMenuTab, t],
  )

  return (
    <div className='z-10 col-span-12 lg:sticky lg:top-56 lg:col-span-5 lg:max-h-[500px]'>
      <div className='mb-6 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between'>
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
            <TextHeading className='text-xl'>{t('Top Competitions')}</TextHeading>
            {!isAll && (
              <Link href='/arena/rankings/competitions'>
                <EmphasisButton>{t('View All')}</EmphasisButton>
              </Link>
            )}
          </div>
          <div>
            <Table
              sortOptions={sortOptions}
              sort={sort}
              setSort={setSort}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              tableBasic
              data={isAll ? finalData : finalData.slice(0, 5)}
              // onlySortDesc
              enabledRedirectOnClickPagination={isAll}
              loading={isLoading}
              enabledRedirectOnClickSort={isAll}
              showPopoverPagination={isAll}
            />
          </div>
        </Box>
      </div>
    </div>
  )
}

export default TopCompetition
