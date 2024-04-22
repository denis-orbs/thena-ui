'use client'

import { gql } from 'graphql-request'
import React, { useCallback, useEffect, useMemo } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { useAssets } from '@/context/assetsContext'
import { fetchFollower, fetchFollowing } from '@/hooks/useUserFollow'
import { v4Client } from '@/lib/graphql'

import { FollowedProfiles } from './FollowedProfiles'
import { UserCompetitions } from './UserCompetitions'
import { UserInfo } from './UserInfo'

const V4_USER_RANK = gql`
  query V4_UER_RANK($id: String!) {
    tradeRankByAddress(address: $id) {
      rank
    }
  }
`

const V4_USER_INFO = gql`
  query V4_USER($id: String!) {
    userById(id: $id) {
      id
      firstInteractAt
      balance
      tradingCompetitions {
        name
        entryFee
        market
        id
        competitionRules {
          winningToken
          tradingTokens
          startingBalance
        }
        prize {
          totalPrize
          token
        }
        timestamp {
          endTimestamp
          startTimestamp
          registrationStart
          registrationEnd
        }
        participants {
          id
          participant {
            id
          }
        }
        maxParticipants
        participantCount
        owner {
          id
          isVerified
        }
        tradingCompetitionSpot
      }
      joinedTCs {
        tradingCompetition {
          name
          entryFee
          market
          id
          competitionRules {
            winningToken
            tradingTokens
            startingBalance
          }
          prize {
            totalPrize
            token
          }
          timestamp {
            endTimestamp
            startTimestamp
            registrationStart
            registrationEnd
          }
          participants {
            id
            participant {
              id
            }
          }
          maxParticipants
          participantCount
          owner {
            id
            isVerified
          }
          tradingCompetitionSpot
        }
      }
      thenianNfts {
        meatadata {
          image
        }
      }
      usernameNfts {
        name
        id
      }
    }
  }
`

const fetchUserInfo = async id => {
  try {
    const { userById } = await v4Client.request(V4_USER_INFO, { id: id.toLowerCase() })

    const { tradeRankByAddress } = await v4Client.request(V4_USER_RANK, { id: id.toLowerCase() })

    return { ...userById, rank: tradeRankByAddress?.[0]?.rank ?? '-' }
  } catch (error) {
    return { error: true }
  }
}

export default function ProfilePage({ params }) {
  const { address } = params

  const { data: userInfo, isLoading } = useSWR(['user info', address.toLowerCase()], () => fetchUserInfo(address), {
    refreshInterval: 60000,
  })

  const { data: following, mutate: mutateFollowing } = useSWR(
    ['following', address.toLowerCase()],
    () => fetchFollowing(address),
    {
      refreshInterval: 60000,
    },
  )

  const { data: followers, mutate: mutateFollower } = useSWR(
    ['followers', address.toLowerCase()],
    () => fetchFollower(address),
    {
      refreshInterval: 60000,
    },
  )

  const assets = useAssets()
  const joinedCompetitions = useMemo(
    () =>
      userInfo?.joinedTCs?.map(comp => ({
        ...comp.tradingCompetition,
        prize: {
          ...comp.tradingCompetition.prize,
          token: assets.find(ele => ele.address.toLowerCase() === comp.tradingCompetition.prize.token.toLowerCase()),
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
      })),
    [assets, userInfo?.joinedTCs],
  )

  const hostedCompetitions = useMemo(
    () =>
      userInfo?.tradingCompetitions?.map(comp => ({
        ...comp,
        prize: {
          ...comp.prize,
          token: assets.find(ele => ele.address.toLowerCase() === comp.prize.token.toLowerCase()),
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
      })),
    [assets, userInfo?.tradingCompetitions],
  )

  const mutateData = useCallback(async () => {
    await mutateFollowing()
    await mutateFollower()
  }, [mutateFollowing, mutateFollower])

  useEffect(() => {
    mutateData()
  }, [mutateData])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className='mt-10 space-y-10'>
      <UserInfo userInfo={userInfo} following={following} followers={followers} />
      {(!!joinedCompetitions.length || !!hostedCompetitions.length) && (
        <UserCompetitions hostedCompetitions={hostedCompetitions} joinedTCs={joinedCompetitions} />
      )}
      {!!following.length && <FollowedProfiles followingUsers={following} />}
    </div>
  )
}
