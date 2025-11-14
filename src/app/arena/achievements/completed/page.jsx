'use client'

import { gql } from 'graphql-request'
import { useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import useWallet from '@/hooks/useWallet'
import { ArenaClient } from '@/lib/graphql'
import { sortAchievements } from '@/lib/utils'
import { Completed } from '@/modules/Achievements/Completed'

import NoAchievement from '../NoAchievement'

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
        ratioAchieved
      }
      currentQuantity
      achievedAt
    }
  }
`

const fetchAchievements = async userId => {
  try {
    const { userAchievements } = await ArenaClient.request(V4_USER_ACHIEVEMENT_COMPLETED, { userId })
    return userAchievements
  } catch (error) {
    return {}
  }
}

function AchievementCompletedPage() {
  const { account } = useWallet()
  const { data: userAchievementsCompleted, isLoading } = useSWR(
    account ? ['userAchievementsCompleted', account] : null,
    () => fetchAchievements(account.toLowerCase()),
  )

  const searchParams = useSearchParams()

  const searchedData = useMemo(() => {
    const search = searchParams.get('q')

    const sortedAchivements = (userAchievementsCompleted || []).sort(sortAchievements)

    if (search && userAchievementsCompleted && userAchievementsCompleted?.length) {
      return sortedAchivements.filter(achievement =>
        achievement.achievement.name.toLowerCase().includes(search.toLowerCase()),
      )
    }
    return sortedAchivements ?? []
  }, [searchParams, userAchievementsCompleted])

  if (isLoading) {
    return <Loading />
  }

  if (!Object.keys(searchedData).length) {
    return <NoAchievement />
  }
  return (
    <div>
      <Completed data={searchedData} />
    </div>
  )
}

export default AchievementCompletedPage
