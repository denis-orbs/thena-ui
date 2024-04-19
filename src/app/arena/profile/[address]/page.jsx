'use client'

import { gql } from 'graphql-request'
import React, { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'

import Loading from '@/app/loading'
import { useAssets } from '@/context/assetsContext'
import { fetchFollowing } from '@/hooks/useUserFollow'
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

  const { data: userInfo, isLoading } = useSWRImmutable(['user info', address], () => fetchUserInfo(address))

  const { data: following } = useSWRImmutable(['following', address], () => fetchFollowing(address))

  const { data: followers } = useSWRImmutable(['followers', address], () => fetchFollowing(address))

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

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className='mt-10 space-y-10'>
      <UserInfo userInfo={userInfo} following={following} followers={followers} />
      {(joinedCompetitions || hostedCompetitions) && (
        <UserCompetitions hostedCompetitions={hostedCompetitions} joinedTCs={joinedCompetitions} />
      )}
      {following && <FollowedProfiles followingUsers={following} />}
    </div>
  )
}
