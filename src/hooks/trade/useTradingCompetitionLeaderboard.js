import { gql } from 'graphql-request'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'

import { useCompetitionFormat } from '../useCompetitionFormat'

const TC_WITH_LEADERBOARD = gql`
  query TC_WITH_LEADERBOARD($id: String!, $searchText: String, $orderBy: [TCParticipantOrderByInput!]) {
    tradingCompetitionById(id: $id) {
      id
      market
      participants(
        orderBy: $orderBy
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

const fetchCompetitionLeaderboard = async (id, searchText, orderBy) => {
  try {
    const { tradingCompetitionById: competition } = await v4Client.request(TC_WITH_LEADERBOARD, {
      id,
      searchText,
      orderBy,
    })

    return competition
  } catch (error) {
    return { error: true }
  }
}

export const useTradingCompetitionLeaderBoard = (id, searchText) => {
  const { data: competitionData } = useSWR('competition detail api')
  let orderBy = ['rank_ASC', 'winTokenDecimal_DESC', 'id_ASC']
  if (competitionData.prizeUpdate.winType) {
    orderBy = ['rank_ASC', 'winTokenDecimal_DESC', 'percentagePnl_DESC', 'id_ASC']
  } else {
    orderBy = ['rank_ASC', 'winTokenDecimal_DESC', 'pnl_DESC', 'id_ASC']
  }
  const { data, isLoading } = useSWR(
    ['competition leader board api', id, searchText],
    () => fetchCompetitionLeaderboard(id, searchText, orderBy),
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
    },
  )

  return {
    competition: useCompetitionFormat(data),
    isLoading,
  }
}

const TC_CURRENT_USER_RANK_AND_PNL = gql`
  query TC_CURRENT_USER_RANK_AND_PNL($id: String!, $userId: String!) {
    tradingCompetitionById(id: $id) {
      id
      participants(where: { participant: { id_eq: $userId } }) {
        pnl
        rank
        winAmountUSD
      }
    }
  }
`

export const fetchUserRankAndPnLInTC = async (id, userId) => {
  try {
    const { tradingCompetitionById: competition } = await v4Client.request(TC_CURRENT_USER_RANK_AND_PNL, {
      id,
      userId,
    })

    return competition
  } catch (error) {
    return { error: true }
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
      refreshInterval: 15000,
      revalidateOnFocus: true,
    },
  )

  return { competitionAccount: data, isLoading }
}
