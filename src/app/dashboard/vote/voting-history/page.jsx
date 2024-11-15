'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { LOCALES } from '@/constant'
import useWallet from '@/hooks/useWallet'
import { v3ClientSubGraph } from '@/lib/graphql'
import { formatAddress } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'
import { ArrowLeftIcon, InfoCircleWhite } from '@/svgs'

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
    label: 'Epoch',
    value: 'epoch',
    width: 'lg:w-[5%]',
    isDesc: true,
  },
  {
    label: 'Pair',
    value: 'pairId',
    width: 'lg:w-[20%]',
  },
  {
    label: 'Total votes',
    value: 'totalVotes',
    width: 'lg:w-[10%]',
    isDesc: true,
  },
  {
    label: 'Rewards',
    value: 'rewards',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'Your vote',
    value: 'yourVote',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'Date',
    value: 'date',
    width: 'lg:w-[20%]',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'lg:w-[20%]',
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
  const { push } = useRouter()
  const t = useTranslations()
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
        date: dayjs.unix(vote.timestamp).format(format),
        action: <PrimaryButton>Claim</PrimaryButton>,
      })),
    [format, votes],
  )

  if (isLoading) return <Loading />

  return (
    <div>
      <TextButton className='justify-start' LeadingIcon={ArrowLeftIcon} onClick={() => push('/dashboard/vote')}>
        {t('Back')}
      </TextButton>
      <TextHeading className='mb-6 mt-4 block font-archia text-3xl font-semibold'>Voting history</TextHeading>
      {finalData.length > 0 ? (
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
      ) : (
        <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
          <Highlight>
            <InfoCircleWhite className='h-4 w-4' />
          </Highlight>
          <div className='flex flex-col items-center gap-3'>
            <h2>{t('No voting history')}</h2>
            <Paragraph className='mt-3 text-center'>{t('You have no voting history to show.')}</Paragraph>
          </div>
        </div>
      )}
    </div>
  )
}
