'use client'

import { useParams } from 'next/navigation'
import React from 'react'

import { useTradingCompetitionLeaderBoard } from '@/hooks/trade/useTradingCompetitionLeaderboard'
import { LeaderBoard } from '@/modules/TradingCompetition/LeaderBoard'

function LeaderBoardPage() {
  const { id } = useParams()

  const { competition } = useTradingCompetitionLeaderBoard(id)

  return (
    <>
      <LeaderBoard competition={competition} />
    </>
  )
}

export default LeaderBoardPage
