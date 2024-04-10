'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { v4Client } from '@/lib/graphql'

const V4_COMPETITION_DATA = gql`
  query V4_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      id
      participants {
        participant {
          id
        }
      }
      competitionRules {
        winningTokenDecimal
        winningToken
      }
    }
  }
`

const getCompetitionParticipants = async id => {
  try {
    const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_DATA, { id })
    return competition.participants ?? []
  } catch (error) {
    return { error: true }
  }
}

// TODO: chang query
const V4_TRADE_RANK_DATA = gql`
  query V4_TRADE_RANK($period: String!, $address: String!) {
    tradeRankByAddress(period: $period, address: $address) {
      id
      participants {
        participant {
          id
        }
      }
      competitionRules {
        winningTokenDecimal
        winningToken
      }
    }
  }
`

// eslint-disable-next-line unused-imports/no-unused-vars
const getTradeRankByAddress = async (period, address) => {
  try {
    const { tradeRankByAddress } = await v4Client.request(V4_TRADE_RANK_DATA, { period, address })
    return tradeRankByAddress
  } catch (error) {
    return { error: true }
  }
}

const fetchCompetitionParticipationData = async id => {
  try {
    const { data: participants } = await getCompetitionParticipants(id)
    console.log('call', participants)
    if (participants) {
      // const getRanks = participants.map(
      //   async participant => await getTradeRankByAddress('2 years', participant.participant.id),
      // )
      // const ranks = await Promise.all(getRanks)
      // if (ranks) {
      //   console.log('ransk', ranks)
      // }
    }
  } catch (error) {
    return { error: true }
  }
}

function ParticipantsPage() {
  const { id } = useParams()

  // eslint-disable-next-line unused-imports/no-unused-vars
  const { data } = useSWR('competition leader board api', () => fetchCompetitionParticipationData(id), {
    refreshInterval: 60000,
  })

  const competition = [] // useCompetitionFormat(data)

  const { push } = useRouter()

  const sortOptions = useMemo(
    () => [
      {
        label: <span>#</span>,
        value: 'rank',
        width: 'w-[10%]',
        isDesc: false,
      },
      {
        label: 'User',
        value: 'user',
        width: 'w-[35%]',
        isDesc: true,
        minWidth: 'min-w-40',
      },
      {
        label: 'Profile Rank',
        value: 'rank',
        width: 'w-[30%]',
        isDesc: true,
        justify: 'justify-center items-center',
      },
      {
        label: 'Total Trading Volume',
        value: 'volume',
        width: 'w-[30%]',
        isDesc: true,
        justify: 'justify-center items-center',
      },
    ],
    [],
  )

  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState(sortOptions[0])
  const [currentPage, setCurrentPage] = useState(1)

  const t = useTranslations()

  const dataParticipants = useMemo(() => [], [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredParticipants = useMemo(() => [], [dataParticipants])

  const sortedData = useMemo(
    () =>
      filteredParticipants?.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'rank':
            res = (a.rank - b.rank) * (sort.isDesc ? -1 : 1)
            break
          case 'user':
            res = sort.isDesc ? a.participant.id - b.participant.id : b.participant.id - a.participant.id
            break

          default:
            break
        }
        return res
      }),
    [filteredParticipants, sort],
  )

  const finalParticipants = useMemo(
    () =>
      sortedData?.map(participant => ({
        rank: <Paragraph>{participant.rank}</Paragraph>,
        user: (
          <Link
            className='flex cursor-pointer items-center justify-center gap-2'
            href={`/arena/profile/${participant.participant.id}`}
          >
            <CircleImage src={Avatar} alt='avatar' className='size-8' />
            <Paragraph>
              {`${participant.participant.id.slice(0, 6)}...${participant.participant.id.slice(-4)}`}
            </Paragraph>
          </Link>
        ),
        volume: <Paragraph>$59.01</Paragraph>,
      })),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competition?.competitionRules?.winningToken?.symbol, push, JSON.stringify(sortedData)],
  )

  return (
    <>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <TextHeading className='text-xl lg:flex-1'>{t('Participants')}</TextHeading>
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>

      <Table
        sortOptions={sortOptions}
        data={finalParticipants}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        tableBasic
      />
    </>
  )
}

export default ParticipantsPage
