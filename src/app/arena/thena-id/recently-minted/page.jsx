'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Table from '@/components/table'
import { Paragraph } from '@/components/typography'
import dayjs from '@/lib/arenaDayjs'
import { v4Client } from '@/lib/graphql'

dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years',
  },
})

const V4_RECENTLY_MINTED = gql`
  query V4_RECENTLY_MINTED {
    usernameNfts {
      id
      index
      name
      timestamp
      owner {
        id
      }
    }
  }
`

const fetchRecentlyMinted = async () => {
  try {
    const { usernameNfts } = await v4Client.request(V4_RECENTLY_MINTED)
    return usernameNfts
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

function RecentlyMintedPage() {
  const sortOptions = useMemo(
    () => [
      {
        label: <span>#</span>,
        value: 'index',
        width: 'w-[10%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Time ago',
        value: 'timestamp',
        width: 'w-[20%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'THENA ID',
        value: 'name',
        width: 'w-[25%]',
        isDesc: true,
        disabled: false,
      },
      {
        label: 'Owner',
        value: 'owner',
        width: 'w-[30%]',
        isDesc: true,
        disabled: false,
      },
    ],
    [],
  )

  const t = useTranslations()
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[0])
  const [dataFetch, setDataFetch] = useState([])

  const { data, isLoading } = useSWR(['top competition api'], () => fetchRecentlyMinted(), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  useEffect(() => {
    if (!isLoading) {
      if (data && Array.isArray(data)) {
        const arr = data.map(item => ({
          index: item.index,
          name: item.name,
          owner: item.owner.id,
          timestamp: item.timestamp,
        }))
        setDataFetch(arr)
      } else {
        setDataFetch([])
      }
    }
  }, [data, isLoading])

  const sortedData = useMemo(
    () =>
      dataFetch?.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'index':
            res = (a.index - b.index) * (sort.isDesc ? -1 : 1)
            break
          case 'timestamp':
            res = (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * (sort.isDesc ? -1 : 1)
            break
          case 'name':
            res = a.name.localeCompare(b.name) * (sort.isDesc ? -1 : 1)
            break
          case 'owner':
            res = a.owner.localeCompare(b.owner) * (sort.isDesc ? -1 : 1)
            break
          default:
            break
        }
        return res
      }),
    [dataFetch, sort],
  )

  const finalData = useMemo(
    () =>
      sortedData?.map(item => ({
        index: <Paragraph>{item.index}</Paragraph>,
        timestamp: <Paragraph>{dayjs(item.timestamp).fromNow()}</Paragraph>,
        name: <Paragraph>{item.name}</Paragraph>,
        owner: (
          <Paragraph className='block w-full text-left'>
            <Link href={`/arena/profile/${item.owner}`}>{item.owner}</Link>
          </Paragraph>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData)],
  )

  return (
    <div>
      <div className='mt-6'>
        <h2>{t('Recently minted THENA IDs')}</h2>
      </div>
      <div className='mt-6 w-full'>
        <Table
          data={finalData}
          sortOptions={sortOptions}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sort={sort}
          setSort={setSort}
          tableBasic
        />
      </div>
    </div>
  )
}

export default RecentlyMintedPage
