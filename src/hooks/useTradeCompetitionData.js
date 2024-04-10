import { gql } from 'graphql-request'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'

import { useCompetitionFormat } from './useCompetitionFormat'

const V4_TRADE_COMPETITION_DATA = gql`
  query V4_TRADE_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      id
      competitionRules {
        winningTokenDecimal
        winningToken
        tradingTokens
        startingBalance
      }
      timestamp {
        endTimestamp
        startTimestamp
        registrationEnd
        registrationStart
      }
      participants {
        pnl
        participant {
          id
        }
      }
      tradingCompetitionSpot
      participantCount
      name
    }
  }
`

const fetchCompetition = async id => {
  try {
    const { tradingCompetitionById: competition } = await v4Client.request(V4_TRADE_COMPETITION_DATA, { id })

    return competition
  } catch (error) {
    return { error: true }
  }
}

export const useTradeCompetitionData = id => {
  const { data } = useSWR('trade competition data', () => fetchCompetition(id), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  return { competition: useCompetitionFormat(data) }
}
