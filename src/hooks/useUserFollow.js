import { gql } from 'graphql-request'
import { useCallback } from 'react'
import useSWR, { mutate as mutateSWR } from 'swr'

import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
import { actionWithAuthentication, useSignWallet } from '@/lib/wallets/useSignWallet'
import useWallet from '@/lib/wallets/useWallet'

// follower of current user
export const V4_FOLLOWERS = gql`
  query V4_USER_FOLLOW($userId: String!) {
    userFollows(where: { user: { id_eq: $userId } }) {
      follower {
        id
        avatar
        username
        isVerified
        nameColor
      }
    }
  }
`
// current user following
export const V4_FOLLOWING = gql`
  query V4_FOLLOWS_USER($followerId: String!) {
    userFollows(where: { follower: { id_eq: $followerId } }) {
      user {
        id
        avatar
        username
        isVerified
        nameColor
      }
    }
  }
`

// mutation
const V4_FOLLOW = gql`
  mutation V4_MUTATION_FOLLOW($userId: String!, $followerId: String!) {
    followUser(input: { followerId: $followerId, userId: $userId }) {
      followerId
      state
      userId
    }
  }
`
export const fetchFollowing = async id => {
  try {
    const { userFollows } = await v4Client.request(V4_FOLLOWING, { followerId: id.toLowerCase() })

    return userFollows
  } catch (error) {
    return undefined
  }
}

export const fetchFollower = async id => {
  try {
    const { userFollows } = await v4Client.request(V4_FOLLOWERS, { userId: id.toLowerCase() })

    return userFollows
  } catch (error) {
    return undefined
  }
}

export const useCurrentUserFollow = () => {
  const { account } = useWallet()

  const { data: following, mutate } = useSWR('current-user-follow', () => fetchFollowing(account.toLocaleLowerCase()), {
    refreshInterval: 60000,
  })

  return { following, mutate }
}

export const useFollow = userId => {
  const { account } = useWallet()
  const { signWallet } = useSignWallet()

  const followFn = useCallback(async () => {
    const { followUser } = await v4Client.request(
      V4_FOLLOW,
      {
        followerId: account.toLowerCase(),
        userId: userId.toLowerCase(),
      },
      {
        authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
      },
    )
    if (followUser) {
      await mutateSWR('current-user-follow')
      await mutateSWR(['followers', userId])
      await mutateSWR(['following', account.toLowerCase()])
    }
  }, [account, userId])

  const follow = useCallback(() => actionWithAuthentication(followFn, signWallet), [followFn, signWallet])
  return { followUser: follow }
}
