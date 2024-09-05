'use client'

import { useParams } from 'next/navigation'
import React from 'react'

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

  const { competition, isLoading: isLoading1 } = useTradingCompetitionLeaderBoard(id)

  const { competitionAccount, isLoading: isLoading2 } = useTradingCompetitionByAccount(id, account?.toLowerCase())

  if (isLoading1 || isLoading2) {
    return <Loading />
  }
  console.log('competitionAccount', competitionAccount)

  return (
    <>
      <LeaderBoard competitionAccount={competitionAccount} competition={competition} />
    </>
  )
}

export default LeaderBoardPage
