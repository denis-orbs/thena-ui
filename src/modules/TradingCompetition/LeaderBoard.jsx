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
import useWallet from '@/hooks/useWallet'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, formatNumberDecimals, fromWei } from '@/lib/utils'
import { FirstPrizeIcon, SecondPrizeIcon, ThirdPrizeIcon } from '@/svgs'

function RankElement({ rank }) {
  switch (rank) {
    case 1: {
      return <FirstPrizeIcon className='size-7 md:size-9' />
    }
    case 2: {
      return <SecondPrizeIcon className='size-7 md:size-9' />
    }
    case 3: {
      return <ThirdPrizeIcon className='size-7 md:size-9' />
    }

    default: {
      return <p className='w-full text-center'>{isNil(rank) ? '-' : rank}</p>
    }
  }
}

export function LeaderBoard({ competition, competitionAccount = undefined }) {
  const { eventType } = useEventType(competition?.timestamp)
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { account } = useWallet()
  const { reloadFetch } = useTradingCompetition()

  const { push } = useRouter()
  const t = useTranslations()

  const { pnl: pnlUserCurrent, winAmount } = useTradeData(
    competition?.tcAddress,
    competition?.competitionRules?.winningToken?.address,
    reloadFetch,
  )

  const handleParticipants = useMemo(
    () => data => {
      if (Array.isArray(data?.participants)) {
        let arr = [...(data?.participants || [])]
        const index = arr.findIndex(item => item.participant.id.toLowerCase() === account?.toLowerCase())

        arr = arr.map(item => ({
          ...item,
          winAmount: item.winAmounts?.length ? item.winAmounts : new Array(data?.prizeUpdate?.token?.length).fill('0'),
          winAmounts: undefined,
        }))

        if (index !== -1 && data?.market === TC_MARKET_TYPES.SPOT) {
          arr[index] = {
            ...arr[index],
            pnl: new BigNumber(pnlUserCurrent).toNumber(),
            winAmount: Array.isArray(winAmount)
              ? !winAmount?.length
                ? new Array(data?.prizeUpdate?.token?.length).fill('0')
                : winAmount.map(item => new BigNumber(item).toNumber())
              : winAmount !== null
                ? [new BigNumber(winAmount).toNumber()]
                : new Array(data?.prizeUpdate?.token?.length).fill('0'),
          }
        }
        return arr
      }
      return []
    },
    [account, pnlUserCurrent, winAmount],
  )

  const participants = useMemo(() => handleParticipants(competition), [competition, handleParticipants])

  const participantsAccount = useMemo(
    () => handleParticipants(competitionAccount),
    [competitionAccount, handleParticipants],
  )

  const handleRenderFinalData = useMemo(
    () => data => {
      const result = data.map(leader => {
        const pnl = fromWei(leader.pnl, leader.competitionRules?.winningTokenDecimal)

        return {
          id: leader?.participant.id,
          rank: <RankElement rank={leader.rank} />,
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
                      fromWei(item, competition?.prizeUpdate?.token[index]?.decimals),
                      false,
                      5,
                      false,
                    )} ${competition.prizeUpdate?.token?.[index]?.symbol || ''}`}
                  </Paragraph>
                ))}
              </div>
            </Paragraph>
          ),
        }
      })
      return result
    },
    [competition?.competitionRules?.winningToken?.symbol, competition?.prizeUpdate?.token],
  )

  const rowDefault = useMemo(() => {
    const data = participantsAccount.map(item => ({
      ...item,
      rank: isNil(item.rank) ? item.rank : item.rank + 1,
    }))
    const result = handleRenderFinalData(data)
    return result[0]
  }, [handleRenderFinalData, participantsAccount])

  const sortOptions = useMemo(
    () =>
      compact([
        {
          label: <span>#</span>,
          value: 'rank',
          width: 'w-[10%]',
          isDesc: false,
          disabled: true,
        },
        {
          label: 'User',
          value: 'user',
          width: 'w-[35%]',
          isDesc: true,
          minWidth: 'min-w-40',
          disabled: true,
        },
        competition?.market === TC_MARKET_TYPES.PERPETUAL || competition?.prizeUpdate?.winType
          ? {
              label: '%PNL',
              value: 'percentagePnl',
              width: 'w-[30%]',
              isDesc: true,
              disabled: true,
            }
          : undefined,
        {
          label: 'Profit & Loss',
          value: 'pnl',
          width: 'w-[30%]',
          isDesc: true,
          disabled: true,
        },
        {
          label: eventType === EVENT_TYPES.LIVE ? 'Potential Reward' : 'Reward',
          value: 'reward',
          width: 'w-[30%]',
          isDesc: true,
          disabled: true,
        },
      ]),
    [competition?.market, competition?.prizeUpdate?.winType, eventType],
  )

  const [sort, setSort] = useState(sortOptions[0])

  const dataParticipants = useMemo(
    () =>
      participants.map(item => ({
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

  const finalLeaderBoards = useMemo(
    () => handleRenderFinalData(filteredLeaderBoards),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competition?.competitionRules?.winningToken?.symbol, push, JSON.stringify(filteredLeaderBoards)],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  const finalRank = useMemo(() => {
    let rank = 0
    if (account) {
      const itemUserIndex = finalLeaderBoards.findIndex(item => item?.id?.toLowerCase() === account.toLowerCase())
      if (itemUserIndex !== -1) {
        rank = itemUserIndex
      }
    }
    return rank
  }, [finalLeaderBoards, account])

  return (
    <div className='rounded-xl bg-[url("/images/pink-bg.png")] bg-cover'>
      <div className='mb-3 flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between'>
        {/* eslint-disable-next-line prettier/prettier */}
        <TextHeading className='text-xl lg:flex-2'>{t('Leaderboard')}</TextHeading>
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>

      <Table
        className='bg-transparent'
        sortOptions={sortOptions}
        data={finalLeaderBoards}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        tableBasic
        hightLightById={account?.toLowerCase() ?? undefined}
        bgHightLight='bg-white bg-opacity-5'
        defaultHead={finalRank > 9 && currentPage === 1 ? rowDefault : undefined}
      />
    </div>
  )
}
