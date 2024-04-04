'use client'

import { gql } from 'graphql-request'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { useCompetitionFormat } from '@/hooks/useCompetitionFormat'
import { v4Client } from '@/lib/graphql'
import { EVENT_TYPES, getEventType } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'

const V4_COMPETITION_DATA = gql`
  query V4_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      id
      participants {
        pnl
        participant {
          id
        }
        winAmount
        winTokenDecimal
      }
      competitionRules {
        winningTokenDecimal
        winningToken
      }
      timestamp {
        endTimestamp
        registrationEnd
        startTimestamp
      }
    }
  }
`

const fetchCompetitionLeaderboard = async id => {
  try {
    const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_DATA, { id })
    return competition
  } catch (error) {
    return { error: true }
  }
}
function LeaderBoardPage() {
  const { id } = useParams()

  const { data } = useSWR('competition leader board api', () => fetchCompetitionLeaderboard(id), {
    refreshInterval: 60000,
  })

  const competition = useCompetitionFormat(data)

  const { push } = useRouter()

  const eventType = useMemo(() => getEventType(competition?.timestamp), [competition?.timestamp])

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
        label: 'Profit & Loss',
        value: 'pnl',
        width: 'w-[30%]',
        isDesc: true,
        justify: 'justify-center items-center',
      },
      {
        label: eventType === EVENT_TYPES.LIVE ? 'Potential Reward' : 'Reward',
        value: 'reward',
        width: 'w-[30%]',
        isDesc: true,
        justify: 'justify-center items-center',
      },
    ],
    [eventType],
  )

  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState(sortOptions[0])
  const [currentPage, setCurrentPage] = useState(1)

  const t = useTranslations()

  const dataParticipants = useMemo(
    () =>
      competition?.participants
        .sort(
          (a, b) =>
            fromWei(b.pnl, b.competitionRules?.winningTokenDecimal) -
            fromWei(a.pnl, a.competitionRules?.winningTokenDecimal),
        )
        .map((item, index) => ({
          ...item,
          rank: index + 1,
        })) ?? [],
    [competition?.participants],
  )

  const filteredLeaderBoards = useMemo(
    () =>
      dataParticipants.filter(item => item.participant.id.toLowerCase().includes(searchText?.toLowerCase() || '')) ||
      [],
    [searchText, dataParticipants],
  )

  const sortedData = useMemo(
    () =>
      filteredLeaderBoards?.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'rank':
            res = (a.rank - b.rank) * (sort.isDesc ? -1 : 1)
            break
          case 'user':
            res = sort.isDesc ? a.participant.id - b.participant.id : b.participant.id - a.participant.id
            break
          case 'pnl':
            res =
              (fromWei(a.pnl, a.competitionRules?.winningTokenDecimal) -
                fromWei(b.pnl, b.competitionRules?.winningTokenDecimal)) *
              (sort.isDesc ? -1 : 1)
            break
          case 'reward':
            res =
              (fromWei(a.winAmount, a.twinTokenDecimal) - fromWei(b.winAmount, b.twinTokenDecimal)) *
              (sort.isDesc ? -1 : 1)
            break

          default:
            break
        }
        return res
      }),
    [filteredLeaderBoards, sort],
  )

  const finalLeaderBoards = useMemo(
    () =>
      sortedData?.map(leader => ({
        rank: <Paragraph>{leader.rank}</Paragraph>,
        user: (
          <div
            className='flex cursor-pointer items-center justify-center gap-2'
            onClick={() => push(`/arena/profile/${leader.participant.id}`)}
          >
            <CircleImage src={Avatar} alt='avatar' className='size-8' />
            <Paragraph>{`${leader.participant.id.slice(0, 6)}...${leader.participant.id.slice(-4)}`}</Paragraph>
          </div>
        ),
        pnl: (
          <Paragraph>
            {`${formatAmount(fromWei(leader.pnl, leader.competitionRules?.winningTokenDecimal), false, 3, false)}
            ${competition?.competitionRules?.winningToken?.symbol}`}
          </Paragraph>
        ),
        reward: (
          <Paragraph>
            {`${formatAmount(fromWei(leader.winAmount, leader.twinTokenDecimal), false, 3, false)} ${
              competition?.competitionRules?.winningToken?.symbol
            }`}
          </Paragraph>
        ),
      })),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competition?.competitionRules?.winningToken?.symbol, push, JSON.stringify(sortedData)],
  )

  return (
    <>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <TextHeading className='text-xl lg:flex-1'>{t('Leaderboard')}</TextHeading>
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>

      <Table
        sortOptions={sortOptions}
        data={finalLeaderBoards}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        tableBasic
      />
    </>
  )
}

export default LeaderBoardPage
