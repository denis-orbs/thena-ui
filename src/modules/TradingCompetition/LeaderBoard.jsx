import { compact, isNil } from 'lodash'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import { UserProfileCard } from '@/components/image/UserProfileCard'
import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant'
import { useEventType } from '@/hooks/useEventType'
import useWallet from '@/hooks/useWallet'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, formatNumberDecimals, fromWei } from '@/lib/utils'
import { FirstPrizeIcon, InfoNeutralIcon, SecondPrizeIcon, ThirdPrizeIcon } from '@/svgs'

import SearchWithDebounce from './SearchWithDebounce'

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

export function LeaderBoard({ competition, searchText = '', setSearchText, competitionAccount = undefined }) {
  const { eventType } = useEventType(competition?.timestamp)
  const [currentPage, setCurrentPage] = useState(1)
  const { account } = useWallet()

  const { push } = useRouter()
  const t = useTranslations()

  const handleParticipants = useMemo(
    () => data => {
      if (Array.isArray(data?.participants)) {
        let arr = [...(data?.participants || [])]
        arr = arr.map(item => ({
          ...item,
          winAmount: item.winAmounts?.length ? item.winAmounts : new Array(data?.prizeUpdate?.token?.length).fill('0'),
          winAmounts: undefined,
        }))
        return arr
      }
      return []
    },
    [],
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
                    )} ${competition?.prizeUpdate?.token?.[index]?.symbol || ''}`}
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

  const finalLeaderBoards = useMemo(
    () => handleRenderFinalData(dataParticipants),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competition?.competitionRules?.winningToken?.symbol, push, JSON.stringify(dataParticipants)],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  const indexUser = useMemo(() => {
    let index = -1
    if (account) {
      const itemUserIndex = finalLeaderBoards.findIndex(item => item?.id?.toLowerCase() === account.toLowerCase())
      if (itemUserIndex !== -1) {
        index = itemUserIndex
      }
    }
    return index
  }, [finalLeaderBoards, account])

  return (
    <div className='rounded-xl bg-[url("/images/pink-bg.png")] bg-cover'>
      <div className='mb-3 flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between'>
        {/* eslint-disable-next-line prettier/prettier */}
        <div className='flex items-center lg:flex-2'>
          <TextHeading className='text-xl'>{t('Leaderboard')}</TextHeading>
          <span>
            <InfoNeutralIcon className='ml-1 w-4' data-tooltip-id='leaderboard-heading' />
            <CustomTooltip
              className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
              id='leaderboard-heading'
              place='bottom'
            >
              {t('Leaderboard is updated every 30-60s')}
            </CustomTooltip>
          </span>
        </div>
        {/* <SearchInput className='w-full lg:flex-1' val={searchText} setVal={handleSearchText} /> */}
        <SearchWithDebounce searchText={searchText} setSearchText={setSearchText} />
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
        defaultHead={(indexUser > 9 || indexUser === -1) && currentPage === 1 ? rowDefault : undefined}
      />
    </div>
  )
}
