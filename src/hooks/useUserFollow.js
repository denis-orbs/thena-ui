import { gql } from 'graphql-request'
import { useCallback } from 'react'
import useSWRImmutable from 'swr/immutable'

import { v4Client } from '@/lib/graphql'
import { errorToast } from '@/lib/notify'
import useWallet from '@/lib/wallets/useWallet'

// follower of current user
export const V4_FOLLOWERS = gql`
  query V4_USER_FOLLOW($userId: String!) {
    userFollows(where: { user: { id_eq: $userId } }) {
      follower {
        id
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

  const { data: following, mutate } = useSWRImmutable('current-user-follow', () =>
    fetchFollowing(account.toLocaleLowerCase()),
  )

  return { following, mutate }
}

export const useFollow = userId => {
  const { account } = useWallet()
  const { mutate } = useCurrentUserFollow()
  const follow = useCallback(async () => {
    try {
      const { followUser } = await v4Client.request(V4_FOLLOW, {
        followerId: account.toLowerCase(),
        userId: userId.toLowerCase(),
      })
      if (followUser) {
        await mutate()
      }
    } catch (error) {
      errorToast('Error', error.shortMessage)
    }
  }, [account, mutate, userId])

  return { followUser: follow }
}
