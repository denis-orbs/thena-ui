import { gql } from 'graphql-request'

import { v4Client } from '@/lib/graphql'

const V4_USER_ACHIEVEMENT_COMPLETED = gql`
  query V4_USER_ACHIEVEMENT_COMPLETED($userId: String!) {
    userAchievements(
      where: { user: { id_eq: $userId }, achievedAt_isNull: false, achievement: { isHidden_eq: false } }
      orderBy: [achievement_groupIndex_ASC, achievement_typeIndex_ASC]
    ) {
      achievement {
        id
        name
        quantityTarget
        groupIndex
        typeIndex
        type
        icon
        description
      }
      currentQuantity
      achievedAt
    }
  }
`
export const fetchAchievementsCompleted = async userId => {
  try {
    const { userAchievements } = await v4Client.request(V4_USER_ACHIEVEMENT_COMPLETED, { userId })

    return userAchievements
  } catch (error) {
    return {}
  }
}

const V4_TRADING_COMPETITION_WON = gql`
  query V4_TRADING_COMPETITION_WON($userId: String!) {
    userLeaderboards(where: { user: { id_eq: $userId } }, limit: 10) {
      competition {
        win
        placeInTop3
        participatedIn
      }
    }
  }
`
export const fetchTradingCompetitionWon = async userId => {
  try {
    const { userLeaderboards } = await v4Client.request(V4_TRADING_COMPETITION_WON, { userId })
    return userLeaderboards ? userLeaderboards[0]?.competition : {}
  } catch (error) {
    return {}
  }
}
