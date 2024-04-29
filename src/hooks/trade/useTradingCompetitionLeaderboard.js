import { gql } from 'graphql-request'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'

import { useCompetitionFormat } from '../useCompetitionFormat'

// TODO: add checkmarkIcon field
const V4_COMPETITION_DATA = gql`
  query V4_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      id
      participants {
        pnl
        participant {
          id
          username
          avatar
          nameColor
          isVerified
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

export const useTradingCompetitionLeaderBoard = id => {
  const { data } = useSWR(['competition leader board api', id], () => fetchCompetitionLeaderboard(id), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  return { competition: useCompetitionFormat(data) }
}
