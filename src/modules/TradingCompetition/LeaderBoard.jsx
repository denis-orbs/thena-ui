import BigNumber from 'bignumber.js'
import { compact, isNil } from 'lodash'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant'
import { useTradingCompetition } from '@/context/tradingCompetitionContext'
import { useEventType } from '@/hooks/useEventType'
import { useTradeData } from '@/hooks/useTcSpotContract'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { customSort, formatAmount, formatNumberDecimals, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

export function LeaderBoard({ competition }) {
  const { eventType } = useEventType(competition?.timestamp)
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { account } = useWallet()
  const { reloadFetch } = useTradingCompetition()

  const { pnl: pnlUserCurrent, winAmount } = useTradeData(
    competition?.tcAddress,
    competition?.competitionRules?.winningToken?.address,
    reloadFetch,
  )

  const participants = useMemo(() => {
    if (Array.isArray(competition?.participants)) {
      let arr = [...(competition?.participants || [])]
      const index = arr.findIndex(item => item.participant.id.toLowerCase() === account?.toLowerCase())

      arr = arr.map(item => ({
        ...item,
        winAmount: item.winAmounts?.length
          ? item.winAmounts
          : new Array(competition?.prizeUpdate?.token?.length).fill('0'),
        winAmounts: undefined,
      }))

      if (index !== -1 && competition?.market === TC_MARKET_TYPES.SPOT) {
        arr[index] = {
          ...arr[index],
          pnl: new BigNumber(pnlUserCurrent).toNumber(),
          winAmount: Array.isArray(winAmount)
            ? !winAmount?.length
              ? new Array(competition?.prizeUpdate?.token?.length).fill('0')
              : winAmount.map(item => new BigNumber(item).toNumber())
            : winAmount !== null
              ? [new BigNumber(winAmount).toNumber()]
              : new Array(competition?.prizeUpdate?.token?.length).fill('0'),
        }
      }
      return arr
    }
    return []
  }, [
    account,
    competition?.market,
    competition?.participants,
    competition?.prizeUpdate?.token?.length,
    pnlUserCurrent,
    winAmount,
  ])

  const { push } = useRouter()
  const t = useTranslations()

  const sortOptions = useMemo(
    () =>
      compact([
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
        competition?.market === TC_MARKET_TYPES.PERPETUAL || competition?.prizeUpdate?.winType
          ? {
              label: '%PNL',
              value: 'percentagePnl',
              width: 'w-[30%]',
              isDesc: true,
            }
          : undefined,
        {
          label: 'Profit & Loss',
          value: 'pnl',
          width: 'w-[30%]',
          isDesc: true,
        },
        {
          label: eventType === EVENT_TYPES.LIVE ? 'Potential Reward' : 'Reward',
          value: 'reward',
          width: 'w-[30%]',
          isDesc: true,
        },
      ]),
    [competition?.market, competition?.prizeUpdate?.winType, eventType],
  )

  const [sort, setSort] = useState(sortOptions[0])

  const dataParticipants = useMemo(
    () =>
      participants
        .sort(
          (a, b) =>
            fromWei(b.pnl, b.competitionRules?.winningTokenDecimal) -
            fromWei(a.pnl, a.competitionRules?.winningTokenDecimal),
        )
        .map(item => ({
          ...item,
          rank: isNil(item.rank) ? item.rank : item.rank + 1,
        })) ?? [],
    [participants],
  )

  const filteredLeaderBoards = useMemo(
    () =>
      dataParticipants.filter(
        item =>
          item.participant.id.toLowerCase().includes(searchText?.toLowerCase() || '') ||
          item.participant.username?.toLowerCase().includes(searchText?.toLowerCase() || ''),
      ) || [],
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
            res = customSort(a.rank, b.rank, sort.isDesc)
            break
          case 'user':
            res = (participantA - participantB) * (sort.isDesc ? 1 : -1)
            break
          case 'percentagePnl':
            res = (a.percentagePnl - b.percentagePnl) * (sort.isDesc ? 1 : -1)
            break
          case 'pnl':
            res =
              (fromWei(a.pnl, a.competitionRules?.winningTokenDecimal) -
                fromWei(b.pnl, b.competitionRules?.winningTokenDecimal)) *
              (sort.isDesc ? -1 : 1)
            break
          case 'reward':
            res =
              (fromWei(a.winAmount[0], a.winTokenDecimal) - fromWei(b.winAmount[0], b.winTokenDecimal)) *
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
          rank: <Paragraph>{leader.rank ?? 'N/A'}</Paragraph>,
          user: <UserProfileCard user={leader.participant} showVerified={leader.participant.isVerified} />,
          percentagePnl: (
            <Paragraph
              className={`${pnl < 0 ? 'text-red-500' : pnl > 0 ? 'text-green-500' : ''}`}
              title={`${formatNumberDecimals(leader.percentagePnl * 100, 12)}%`}
            >
              {`${formatNumberDecimals(leader.percentagePnl * 100, 4)}%`}
            </Paragraph>
          ),
          pnl: (
            <Paragraph
              className={`${pnl < 0 ? 'text-red-500' : pnl > 0 ? 'text-green-500' : ''}`}
              title={`${formatAmount(pnl, false, 12, false)} ${competition?.competitionRules?.winningToken?.symbol}`}
            >
              {`${formatAmount(pnl, false, 5, false)}
              ${competition?.competitionRules?.winningToken?.symbol || ''}`}
            </Paragraph>
          ),
          reward: (
            <Paragraph className='w-full'>
              <div className='flex flex-col items-start'>
                {leader.winAmount.map((item, index) => (
                  <Paragraph key={index}>
                    {`${formatAmount(
                      fromWei(item, competition.prizeUpdate?.token[index]?.decimals),
                      false,
                      5,
                      false,
                    )} ${competition.prizeUpdate.token?.[index]?.symbol || ''}`}
                  </Paragraph>
                ))}
              </div>
            </Paragraph>
          ),
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competition?.competitionRules?.winningToken?.symbol, push, JSON.stringify(sortedData)],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  return (
    <>
      <div className='mb-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
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
