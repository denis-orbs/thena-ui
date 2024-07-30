'use client'

import { gql } from 'graphql-request'
import { useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { v4Client } from '@/lib/graphql'
import useWallet from '@/lib/wallets/useWallet'
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
      }
      currentQuantity
      achievedAt
      ratioAchieved
    }
  }
`

const fetchAchievements = async userId => {
  try {
    const { userAchievements } = await v4Client.request(V4_USER_ACHIEVEMENT_COMPLETED, { userId })
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
    if (search && userAchievementsCompleted && Object.keys(userAchievementsCompleted)) {
      const clone = {}
      Object.keys(userAchievementsCompleted).forEach(key => {
        const items = userAchievementsCompleted[key].filter(achieve =>
          achieve.achievement.name.toLowerCase().includes(search.toLowerCase()),
        )
        if (items.length) {
          clone[key] = items
        }
      })
      return clone
    }
    return userAchievementsCompleted ?? {}
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
