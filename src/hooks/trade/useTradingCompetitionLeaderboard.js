import { gql } from 'graphql-request'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'

import { useCompetitionFormat } from '../useCompetitionFormat'

const V4_COMPETITION_DATA_LEADERBOARD = gql`
  query V4_COMPETITION_DATA_LEADERBOARD($id: String!, $searchText: String) {
    tradingCompetitionById(id: $id) {
      id
      market
      participants(
        orderBy: rank_ASC
        where: {
          OR: [{ participant: { id_contains: $searchText } }, { participant: { username_contains: $searchText } }]
        }
      ) {
        pnl
        percentagePnl
        rank
        winAmounts
        winTokenDecimal
        participant {
          id
          username
          avatar
          nameColor
          isVerified
          checkMarkIcon
          verifiedAt
        }
      }
      competitionRules {
        winningTokenDecimal
        winningToken
      }
      timestamp {
        endTimestamp
        startTimestamp
      }
      prizeUpdate {
        token
        winType
      }
      tcAddress
    }
  }
`

const fetchCompetitionLeaderboard = async (id, searchText) => {
  try {
    const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_DATA_LEADERBOARD, {
      id,
      searchText,
    })

    return competition
  } catch (error) {
    return { error: true }
  }
}

export const useTradingCompetitionLeaderBoard = (id, searchText) => {
  const { data, isLoading } = useSWR(
    ['competition leader board api', id, searchText],
    () => fetchCompetitionLeaderboard(id, searchText),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  )

  return {
    competition: useCompetitionFormat(data),
    isLoading,
  }
}

const V4_COMPETITION_BY_ACCOUNT = gql`
  query V4_COMPETITION_BY_ACCOUNT($competitionId: String!, $account: String!) {
    tradingCompetitionById(id: $competitionId) {
      id
      market
      participants(where: { participant: { id_eq: $account } }) {
        pnl
        percentagePnl
        participant {
          id
          username
          avatar
          nameColor
          isVerified
          checkMarkIcon
          verifiedAt
        }
        rank
        winAmounts
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
      prizeUpdate {
        token
        winType
      }
      tcAddress
    }
  }
`

const fetchCompetitionByAccount = async (competitionId, account) => {
  if (!account) {
    return false
  }
  try {
    const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_BY_ACCOUNT, {
      competitionId,
      account,
    })

    return competition
  } catch (error) {
    return { error: true }
  }
}

export const useTradingCompetitionByAccount = (competitionId, account) => {
  const { data, isLoading } = useSWR(
    ['competition by account', competitionId, account],
    () => fetchCompetitionByAccount(competitionId, account),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  )

  return { competitionAccount: data, isLoading }
}
