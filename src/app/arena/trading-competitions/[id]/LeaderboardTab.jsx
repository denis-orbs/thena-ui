'use client'

import { gql } from 'graphql-request'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { TabPanel } from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
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

export function LeaderboardTab({ competition, selectedTab }) {
  const { data } = useSWR('competition leader board api', () => fetchCompetitionLeaderboard(competition.id), {
    refreshInterval: 60000,
  })

  const { push } = useRouter()

  const eventType = useMemo(() => getEventType(competition.timestamp), [competition.timestamp])

  const sortOptions = useMemo(
    () => [
      {
        label: <span>#</span>,
        value: 'index',
        width: 'w-[10%]',
        isDesc: true,
        disabled: true,
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
  const [sort, setSort] = useState(sortOptions[1])
  const [currentPage, setCurrentPage] = useState(1)

  const t = useTranslations()

  const filteredLeaderBoards = useMemo(
    () =>
      data?.participants?.filter(item => item.participant.id.toLowerCase().includes(searchText?.toLowerCase() || '')) ||
      [],
    [searchText, data],
  )

  const sortedData = useMemo(
    () =>
      filteredLeaderBoards?.sort((a, b) => {
        let res
        switch (sort.value) {
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
      sortedData?.map((leader, index) => ({
        index: <Paragraph>{index + 1}</Paragraph>,
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
            ${competition.competitionRules?.winningToken?.symbol}`}
          </Paragraph>
        ),
        reward: (
          <Paragraph>
            {`${formatAmount(fromWei(leader.winAmount, leader.twinTokenDecimal), false, 3, false)} ${
              competition.competitionRules?.winningToken?.symbol
            }`}
          </Paragraph>
        ),
      })),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competition.competitionRules?.winningToken?.symbol, push, JSON.stringify(sortedData)],
  )

  return (
    <TabPanel select={selectedTab} value='Leaderboard'>
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
    </TabPanel>
  )
}
