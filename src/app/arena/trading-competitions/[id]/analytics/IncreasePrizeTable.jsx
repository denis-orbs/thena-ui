'use client'

import localizedFormat from 'dayjs/plugin/localizedFormat'
import { gql } from 'graphql-request'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import dayjs from '@/lib/arenaDayjs'
import { v4Client } from '@/lib/graphql'
import { formatAmount, fromWei } from '@/lib/utils'

dayjs.extend(localizedFormat)

const V4_TC_INCREASE_PRIZES = gql`
  query V4_TC_INCREASE_PRIZES($tcId: String!) {
    tcIncreasedPrizes(where: { tradingCompetition: { id_eq: $tcId } }) {
      id
      amount
      timestamp
      user {
        avatar
        checkMarkIcon
        id
        isAdmin
        isSuperAdmin
        isVerified
        nameColor
        username
      }
      token {
        symbol
        decimals
        id
      }
    }
  }
`

const fetchTcInCreasedPrizes = async tcId => {
  try {
    const { tcIncreasedPrizes } = await v4Client.request(V4_TC_INCREASE_PRIZES, { tcId })
    return tcIncreasedPrizes
  } catch (error) {
    return { error: true }
  }
}

function IncreasePrizeTable() {
  const { id: tcId } = useParams()
  const t = useTranslations()

  const sortOptions = useMemo(
    () => [
      {
        label: 'Prize Increase',
        value: 'amount',
        width: 'w-[35%]',
        isDesc: true,
        minWidth: 'min-w-40',
      },
      {
        label: 'Increased By',
        value: 'user',
        width: 'w-[30%]',
        isDesc: true,
      },
      {
        label: 'Last Updated',
        value: 'timestamp',
        width: 'w-[30%]',
        isDesc: true,
      },
    ],
    [],
  )

  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[2])

  const { data: increasedPrizesData, isLoading } = useSWR(
    ['get tc increased prizes', tcId],
    () => fetchTcInCreasedPrizes(tcId),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  )

  const filteredData = useMemo(
    () =>
      (Array.isArray(increasedPrizesData) ? increasedPrizesData : [])?.filter(
        item =>
          item.user.id.toLowerCase().includes(searchText.toLowerCase() || '') ||
          item.user.username?.toLowerCase().includes(searchText.toLowerCase() || ''),
      ),

    [increasedPrizesData, searchText],
  )

  const sortedData = useMemo(
    () =>
      filteredData?.sort((a, b) => {
        let res
        const userA = a.user.username ?? a.user.id
        const userB = b.user.username ?? b.user.id
        switch (sort.value) {
          case 'amount':
            res = (fromWei(a.amount).toNumber() - fromWei(b.amount).toNumber()) * (sort.isDesc ? -1 : 1)
            break
          case 'user':
            res = (userA - userB) * (sort.isDesc ? -1 : 1)
            break
          case 'timestamp':
            res = (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * (sort.isDesc ? -1 : 1)
            break
          default:
            break
        }
        return res
      }),
    [filteredData, sort],
  )

  const finalData = useMemo(
    () =>
      sortedData?.map(item => ({
        amount: (
          <Paragraph>
            {formatAmount(fromWei(item.amount, item.token.decimals))} {item.token.symbol}
          </Paragraph>
        ),
        user: <UserProfileCard user={item.user} showVerified={item.user?.isVerified} />,
        timestamp: <Paragraph>{dayjs(item.timestamp).tz().format('MMM D, YYYY h:mm')}</Paragraph>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData)],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  return (
    <div className='mt-6'>
      <div className='mb-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <TextHeading className='text-xl lg:flex-1'>{t('Prize Increases')}</TextHeading>
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>

      <Table
        sortOptions={sortOptions}
        data={finalData}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={isLoading}
        tableBasic
      />
    </div>
  )
}

export default IncreasePrizeTable
