'use client'

import { gql } from 'graphql-request'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Skeleton from '@/components/skeleton'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { useCompetitionFormat } from '@/hooks/useCompetitionFormat'
import { v4Client } from '@/lib/graphql'
import { customSort, formatNumberDecimals } from '@/lib/utils'

const V4_TC_COMPETITION_DATA = gql`
  query V4_TC_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      id
      participants {
        participant {
          id
          username
          avatar
          isVerified
          nameColor
          checkMarkIcon
          verifiedAt
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
    const { tradingCompetitionById: competition } = await v4Client.request(V4_TC_COMPETITION_DATA, { id })
    return competition
  } catch (error) {
    return { error: true }
  }
}

const V4_TRADE_RANK_DATA = gql`
  query V4_TRADE_RANK($participantIds: [String!]!) {
    tradeRankByParticipants(participantIds: $participantIds) {
      rank
      volume
      address
    }
  }
`

const getTradeRankByAddress = async participantIds => {
  try {
    const { tradeRankByParticipants } = await v4Client.request(V4_TRADE_RANK_DATA, { participantIds })
    return tradeRankByParticipants
  } catch (error) {
    return { error: true }
  }
}

const fetchCompetitionParticipationData = async id => {
  try {
    const competition = await getCompetitionParticipants(id)

    if (competition.participants.length) {
      const participantIds = competition.participants.map(participant => participant.participant.id)

      const ranks = await getTradeRankByAddress(participantIds)

      const rankMap = {}
      ranks.forEach(rank => {
        rankMap[rank.address.toLowerCase()] = rank
      })

      competition.participants = competition.participants.map(participant => {
        const address = participant.participant.id.toLowerCase()
        const rankInfo = rankMap[address]

        return {
          ...participant,
          rank: rankInfo?.rank,
          volume: rankInfo?.volume,
        }
      })
    }

    return competition
  } catch (error) {
    return { error: true }
  }
}

function ParticipantsPage() {
  const { id } = useParams()

  const { data: _competition, isLoading } = useSWR(
    ['competition participants api', id],
    () => fetchCompetitionParticipationData(id),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
    },
  )

  const competition = useCompetitionFormat(_competition)

  const sortOptions = useMemo(
    () => [
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
        isDesc: false,
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
  const [sort, setSort] = useState(sortOptions[1])
  const [currentPage, setCurrentPage] = useState(1)

  const t = useTranslations()

  const dataParticipants = useMemo(
    () => competition?.participants?.sort((a, b) => customSort(a.rank, b.rank, false)) || [],
    [competition?.participants],
  )

  const filteredParticipants = useMemo(
    () => dataParticipants?.filter(item => item.participant.id.toLowerCase().includes(searchText.toLowerCase() || '')),

    [searchText, dataParticipants],
  )

  const sortedData = useMemo(
    () =>
      filteredParticipants?.sort((a, b) => {
        let res
        const participantA = a.participant.username ?? a.participant.id
        const participantB = b.participant.username ?? b.participant.id
        switch (sort.value) {
          case 'rank':
            res = customSort(a.rank, b.rank, sort.isDesc)
            break
          case 'user':
            res = (participantA - participantB) * (sort.isDesc ? 1 : -1)
            break
          case 'volume':
            res = customSort(a.volume, b.volume, sort.isDesc)
            break
          default:
            break
        }
        return res
      }),
    [filteredParticipants, sort],
  )

  const finalParticipants = useMemo(
    () => {
      if (isLoading) {
        return [
          {
            rank: <Skeleton className='h-[30px] w-full' />,
            user: <Skeleton className='h-[30px] w-full' />,
            volume: <Skeleton className='h-[30px] w-full' />,
          },
        ]
      }
      return sortedData?.map(participant => ({
        rank: <Paragraph>{participant.rank ?? '-'}</Paragraph>,
        user: participant.participant && (
          <UserProfileCard user={participant.participant} showVerified={participant.participant.isVerified} />
        ),
        volume: <Paragraph>{participant.volume ? `$${formatNumberDecimals(participant.volume, 2)}` : '-'}</Paragraph>,
      }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isLoading,
      competition?.competitionRules?.winningToken?.decimal,
      competition?.competitionRules?.winningToken?.symbol,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(sortedData),
    ],
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
