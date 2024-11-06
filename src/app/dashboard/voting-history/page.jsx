'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import Image from 'next/image'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useState } from 'react'

import Loading from '@/app/loading'
import Table from '@/components/table'
import { TextHeading } from '@/components/typography'
import { LOCALES } from '@/constant'
import useWallet from '@/hooks/useWallet'
import { v3ClientSubGraph } from '@/lib/graphql'
import { formatAddress } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'

const V3_VOTES = gql`
  query V3_VOTES($voter: String!) {
    votes(where: { voter: $voter }) {
      blockNumber
      timestamp: blockTimestamp
      id
      tokenId
      transactionHash
      voter
    }
  }
`

const fetVotingHistory = async account => {
  try {
    const { votes } = await v3ClientSubGraph.request(V3_VOTES, { voter: account.toLowerCase() })
    if (votes) {
      return votes
    }
    return null
  } catch (error) {
    console.trace(error)
    return null
  }
}

const sortOptions = [
  {
    label: 'Voter',
    value: 'voter',
    width: 'lg:w-[20%]',
    isDesc: true,
  },
  {
    label: 'Token Id',
    value: 'tokenId',
    width: 'lg:w-[14%]',
    isDesc: true,
  },
  {
    label: 'Block Number',
    value: 'blockNumber',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'Timestamp',
    value: 'timestamp',
    width: 'lg:w-[14%]',
    isDesc: true,
  },
]

function UserElement({ username }) {
  return (
    <div className='flex items-center gap-2 md:gap-3'>
      <Image src={Avatar} className='!size-8 rounded-full md:!size-9' width={36} height={36} alt='Avatar' />
      <div className='break-all text-sm md:text-base'>{username}</div>
    </div>
  )
}

export default function VotingHistoryPage() {
  const { locale } = useLocaleSettings()
  const [sort, setSort] = useState(sortOptions[0])
  const [currentPage, setCurrentPage] = useState(1)
  const { account } = useWallet()

  const format = useMemo(() => (locale === LOCALES.en ? 'MMM DD, YYYY hh:mm A' : 'YYYY年MM月DD号 HH点mm分'), [locale])

  const { data: votes, isLoading } = useQuery({
    queryKey: ['voting history', account],
    queryFn: () => fetVotingHistory(account),
    refetchInterval: 30000,
    enabled: Boolean(account),
    gcTime: 0,
  })

  const finalData = useMemo(
    () =>
      (votes || []).map(vote => ({
        voter: <UserElement username={formatAddress(vote.voter)} />,
        tokenId: <span>{`veTHE#${vote.tokenId}`}</span>,
        blockNumber: vote.blockNumber,
        timestamp: dayjs.unix(vote.timestamp).format(format),
      })),
    [format, votes],
  )

  if (isLoading) return <Loading />

  console.log({ votes })

  return (
    <div>
      <TextHeading className='block font-archia text-3xl font-semibold'>Voting history</TextHeading>
      <Table
        sortOptions={sortOptions}
        data={finalData}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={10}
        tableBasic
      />
    </div>
  )
}
