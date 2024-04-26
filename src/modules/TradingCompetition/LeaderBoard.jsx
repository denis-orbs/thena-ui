import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { useEventType } from '@/hooks/useEventType'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'

export function LeaderBoard({ competition }) {
  const { eventType } = useEventType(competition?.timestamp)
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { push } = useRouter()
  const t = useTranslations()

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

  const [sort, setSort] = useState(sortOptions[0])

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
        const participantA = a.participant.username ?? a.participant.id
        const participantB = b.participant.username ?? b.participant.id
        switch (sort.value) {
          case 'rank':
            res = (a.rank - b.rank) * (sort.isDesc ? -1 : 1)
            break
          case 'user':
            res = (participantA - participantB) * (sort.isDesc ? 1 : -1)
            break
          case 'pnl':
            res =
              (fromWei(a.pnl, a.competitionRules?.winningTokenDecimal) -
                fromWei(b.pnl, b.competitionRules?.winningTokenDecimal)) *
              (sort.isDesc ? -1 : 1)
            break
          case 'reward':
            res =
              (fromWei(a.winAmount, a.winTokenDecimal) - fromWei(b.winAmount, b.winTokenDecimal)) *
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
      sortedData?.map(leader => {
        const pnl = fromWei(leader.pnl, leader.competitionRules?.winningTokenDecimal)
        return {
          rank: <Paragraph>{leader.rank}</Paragraph>,
          user: (
            <UserProfileCard
              avatar={leader.participant.avatar}
              username={leader.participant.username}
              id={leader.participant.id}
            />
          ),
          pnl: (
            <Paragraph className={`${pnl < 0 ? 'text-red-500' : pnl > 0 ? 'text-green-500' : ''}`}>
              {`${formatAmount(pnl, false, 5, false)}
              ${competition?.competitionRules?.winningToken?.symbol}`}
            </Paragraph>
          ),
          reward: (
            <Paragraph>
              {`${formatAmount(fromWei(leader.winAmount, leader.winTokenDecimal), false, 5, false)} ${
                competition?.competitionRules?.winningToken?.symbol
              }`}
            </Paragraph>
          ),
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competition?.competitionRules?.winningToken?.symbol, push, JSON.stringify(sortedData)],
  )

  return (
    <>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        {/* eslint-disable-next-line prettier/prettier */}
        <TextHeading className='text-xl lg:flex-2'>{t('Leaderboard')}</TextHeading>
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
