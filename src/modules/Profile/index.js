import { gql } from 'graphql-request'
import { groupBy } from 'lodash'

import { v4Client } from '@/lib/graphql'

const V4_USER_ACHIEVEMENT_COMPLETED = gql`
  query V4_USER_ACHIEVEMENT_COMPLETED($userId: String!) {
    userAchievements(
      where: { user: { id_eq: $userId }, achievedAt_isNull: false, achievement: { isHidden_eq: false } }
      orderBy: achievement_groupIndex_ASC
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

const V4_USER_ACHIEVEMENT = gql`
  query V4_USER_ACHIEVEMENT($userId: String!) {
    userAchievements(where: { user: { id_eq: $userId } }, orderBy: achievement_groupIndex_ASC) {
      achievement {
        id
        name
        quantityTarget
        groupIndex
        typeIndex
        type
        icon
        description
        ratioAchieved
      }
      currentQuantity
      achievedAt
    }
    achievements(where: { isHidden_eq: false }, orderBy: [groupIndex_ASC, typeIndex_ASC]) {
      id
      name
      quantityTarget
      groupIndex
      typeIndex
      type
      icon
      description
      ratioAchieved
    }
  }
`

export const fetchAchievements = async userId => {
  try {
    const { userAchievements, achievements } = await v4Client.request(V4_USER_ACHIEVEMENT, { userId })

    const userAchievementMap = userAchievements.reduce((map, userAchievement) => {
      // eslint-disable-next-line max-len
      const key = `${userAchievement.achievement.id}-${userAchievement.achievement.groupIndex}-${userAchievement.achievement.typeIndex}`
      map[key] = userAchievement
      return map
    }, {})

    const result = achievements.map(achievement => {
      const key = `${achievement.id}-${achievement.groupIndex}-${achievement.typeIndex}`
      const userAchievement = userAchievementMap[key]
      if (userAchievement) {
        return {
          achievement,
          currentQuantity: userAchievement.currentQuantity,
          achievedAt: userAchievement.achievedAt,
        }
      }
      return {
        achievement,
        currentQuantity: 0,
        achievedAt: null,
      }
    })

    return groupBy(result, 'achievement.type')
  } catch (error) {
    return {}
  }
}
