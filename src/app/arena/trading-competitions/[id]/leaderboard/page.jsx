'use client'

import { useParams } from 'next/navigation'
import React, { useState } from 'react'

import Loading from '@/app/loading'
import {
  useTradingCompetitionByAccount,
  useTradingCompetitionLeaderBoard,
} from '@/hooks/trade/useTradingCompetitionLeaderboard'
import useWallet from '@/hooks/useWallet'
import { LeaderBoard } from '@/modules/TradingCompetition/LeaderBoard'

function LeaderBoardPage() {
  const { id } = useParams()
  const { account } = useWallet()
  const [sort, setSort] = useState({
    label: <span>#</span>,
    value: 'rank',
    width: 'w-[10%]',
    isDesc: true,
    disabled: false,
  })

  const [searchText, setSearchText] = useState('')

  const { competition, isLoading: isLoading1 } = useTradingCompetitionLeaderBoard(id, searchText?.toLowerCase(), sort)

  const { competitionAccount, isLoading: isLoading2 } = useTradingCompetitionByAccount(id, account?.toLowerCase())

  if (isLoading1 || isLoading2) {
    return <Loading />
  }

  return (
    <>
      <LeaderBoard
        competitionAccount={competitionAccount}
        competition={competition}
        searchText={searchText}
        setSearchText={setSearchText}
        sort={sort}
        setSort={setSort}
      />
    </>
  )
}

export default LeaderBoardPage
