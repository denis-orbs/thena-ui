import { redirect } from 'next/navigation'
import React, { useCallback, useEffect, useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { useAssets } from '@/context/assetsContext'
import { fetchUserInfo } from '@/context/userInfoContext'
import { fetchFollower, fetchFollowing } from '@/hooks/useUserFollow'

import { FollowedProfiles } from './FollowedProfiles'
import { UserCompetitions } from './UserCompetitions'
import { UserCompletedAchievements } from './UserCompletedAchievements'
import { UserInfo } from './UserInfo'
import UserThenaIds from './UserThenaIds'

export function ProfilePage({ address }) {
  const decodedAddress = useMemo(() => decodeURIComponent(address), [address])

  const { data: userInfo, isLoading } = useSWR(['user info', address], () => fetchUserInfo(decodedAddress), {
    refreshInterval: 60000,
  })

  if (userInfo && userInfo.username && ![userInfo.username, userInfo.id].includes(decodedAddress)) {
    redirect(`/arena/profile/${decodeURIComponent(userInfo.username)}`)
  }

  const { data: following, mutate: mutateFollowing } = useSWR(
    ['following', address],
    () => fetchFollowing(decodedAddress),
    {
      refreshInterval: 60000,
    },
  )

  const { data: followers, mutate: mutateFollower } = useSWR(
    ['followers', address],
    () => fetchFollower(decodedAddress),
    {
      refreshInterval: 60000,
    },
  )

  const assets = useAssets()

  const joinedCompetitions = useMemo(
    () =>
      userInfo?.joinedTCs?.map(comp => ({
        ...comp.tradingCompetition,
        prizeUpdate: {
          ...comp.tradingCompetition.prizeUpdate,
          token: comp.tradingCompetition.prizeUpdate.token.map(token => {
            const asset = assets.find(ele => ele.address.toLowerCase() === token.toLowerCase())
            return asset
          }),
        },
        competitionRules: {
          ...comp.tradingCompetition.competitionRules,
          winningToken: assets.find(
            ele => ele.address.toLowerCase() === comp.tradingCompetition.competitionRules.winningToken.toLowerCase(),
          ),
          tradingTokens: assets.filter(ele =>
            comp.tradingCompetition.competitionRules.tradingTokens.map(sub => sub.toLowerCase()).includes(ele.address),
          ),
        },
      })) || [],
    [assets, userInfo?.joinedTCs],
  )

  const hostedCompetitions = useMemo(
    () =>
      userInfo?.tradingCompetitions?.map(comp => ({
        ...comp,
        prizeUpdate: {
          ...comp.prizeUpdate,
          token: comp.prizeUpdate.token.map(token => {
            const asset = assets.find(ele => ele.address.toLowerCase() === token.toLowerCase())
            return asset
          }),
        },
        competitionRules: {
          ...comp.competitionRules,
          winningToken: assets.find(
            ele => ele.address.toLowerCase() === comp.competitionRules.winningToken.toLowerCase(),
          ),
          tradingTokens: assets.filter(ele =>
            comp.competitionRules.tradingTokens.map(sub => sub.toLowerCase()).includes(ele.address),
          ),
        },
      })) || [],
    [assets, userInfo?.tradingCompetitions],
  )

  const mutateData = useCallback(async () => {
    await mutateFollowing()
    await mutateFollower()
  }, [mutateFollowing, mutateFollower])

  useEffect(() => {
    mutateData()
  }, [mutateData])

  if (isLoading || !userInfo) {
    return <Loading />
  }

  return (
    <div className='mt-10 space-y-10'>
      <UserInfo userInfo={userInfo} following={following} followers={followers} />
      <UserCompletedAchievements userId={userInfo.id} />
      {userInfo && userInfo.usernameNfts?.length > 0 && <UserThenaIds thenaIds={userInfo.usernameNfts} />}
      {(!!joinedCompetitions.length || !!hostedCompetitions.length) && (
        <UserCompetitions hostedCompetitions={hostedCompetitions} joinedTCs={joinedCompetitions} />
      )}
      {!!following?.length && <FollowedProfiles followingUsers={following} maxShow={15} showViewFollowing />}
    </div>
  )
}
