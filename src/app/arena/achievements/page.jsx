'use client'

import { gql } from 'graphql-request'
import { groupBy } from 'lodash'
import { useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { v4Client } from '@/lib/graphql'
import useWallet from '@/lib/wallets/useWallet'
import { AchievementSection } from '@/modules/Achievements/AchievementSection'

import NoAchievement from './NoAchievement'

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

const fetchAchievements = async userId => {
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

function AchievementPage() {
  const { account } = useWallet()
  const { data: userAchievements, isLoading } = useSWR(account ? ['userAchievements', account] : null, () =>
    fetchAchievements(account.toLowerCase()),
  )

  const searchParams = useSearchParams()

  const searchedData = useMemo(() => {
    const search = searchParams.get('q')
    if (search && userAchievements && Object.keys(userAchievements)) {
      const clone = {}
      Object.keys(userAchievements).forEach(key => {
        const items = userAchievements[key].filter(achieve =>
          achieve.achievement.name.toLowerCase().includes(search.toLowerCase()),
        )

        if (items.length) {
          clone[key] = items
        }
      })
      return clone
    }
    return userAchievements ?? {}
  }, [searchParams, userAchievements])

  if (isLoading && !userAchievements) {
    return <Loading />
  }

  if (!Object.keys(searchedData).length) {
    return <NoAchievement />
  }

  return (
    <>
      {Object.keys(searchedData).map(key => (
        <AchievementSection data={searchedData[key]} group={key} key={key} />
      ))}
    </>
  )
}

export default AchievementPage
