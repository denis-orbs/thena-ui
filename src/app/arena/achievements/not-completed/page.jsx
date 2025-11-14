'use client'

import { gql } from 'graphql-request'
import { useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import useWallet from '@/hooks/useWallet'
import { ArenaClient } from '@/lib/graphql'
import { NotCompleted } from '@/modules/Achievements/NotCompleted'

import NoAchievement from '../NoAchievement'

const V4_USER_ACHIEVEMENTS = gql`
  query V4_USER_ACHIEVEMENTS($userId: String!) {
    userAchievements(
      where: { user: { id_eq: $userId }, achievement: { isHidden_eq: false } }
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
        ratioAchieved
      }
      currentQuantity
      achievedAt
    }
  }
`

const fetchUserAchievements = async userId => {
  try {
    const { userAchievements } = await ArenaClient.request(V4_USER_ACHIEVEMENTS, { userId })
    return userAchievements
  } catch (error) {
    return {}
  }
}

const V4_ACHIEVEMENTS = gql`
  query V4_ACHIEVEMENTS {
    achievements(where: { isHidden_eq: false }, orderBy: [groupIndex_ASC, typeIndex_ASC]) {
      icon
      id
      isHidden
      name
      quantityTarget
      type
      typeIndex
      groupIndex
      description
      createdAt
      ratioAchieved
    }
  }
`
const fetchAchievements = async () => {
  try {
    const { achievements } = await ArenaClient.request(V4_ACHIEVEMENTS)
    return achievements
  } catch (error) {
    return {}
  }
}

function AchievementCompletedPage() {
  const { account } = useWallet()
  const { data: userAchievementsCompleted, isLoading: isLoadingUserAchievements } = useSWR(
    account ? ['userAchievementsCompleted', account] : null,
    () => fetchUserAchievements(account.toLowerCase()),
  )
  const { data: achievements, isLoading: isLoadingAchievement } = useSWR(
    account ? ['achievements', account] : null,
    () => fetchAchievements(),
  )

  const userAchievementNotComplete = useMemo(() => {
    if (achievements?.length && userAchievementsCompleted?.length) {
      return achievements
        .filter(
          achievement =>
            !userAchievementsCompleted?.find(
              userAchievement => userAchievement.achievement.id === achievement.id && userAchievement.achievedAt,
            ),
        )
        .map(achievement => {
          const currentQuantity =
            userAchievementsCompleted?.find(userAchievement => userAchievement.achievement.id === achievement.id)
              ?.currentQuantity ?? 0
          return {
            ...achievement,
            currentQuantity,
          }
        })
    }
    return []
  }, [userAchievementsCompleted, achievements])

  const searchParams = useSearchParams()

  const searchedData = useMemo(() => {
    const search = searchParams.get('q')
    if (search && userAchievementNotComplete && userAchievementNotComplete?.length) {
      return userAchievementNotComplete.filter(achievement =>
        achievement.name.toLowerCase().includes(search.toLowerCase()),
      )
    }
    return userAchievementNotComplete ?? []
  }, [searchParams, userAchievementNotComplete])

  if (isLoadingUserAchievements || isLoadingAchievement) {
    return <Loading />
  }
  if (!searchedData.length) {
    return <NoAchievement />
  }
  return (
    <div>
      <NotCompleted achievements={searchedData} />
    </div>
  )
}

export default AchievementCompletedPage
