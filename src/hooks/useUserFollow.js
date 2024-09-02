import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import useSWR, { mutate as mutateSWR } from 'swr'
import { ChainId } from 'thena-sdk-core'

import { ThenaAuthToken } from '@/constant'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import useWallet from '@/hooks/useWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { errorToast, successToast } from '@/lib/notify'

// follower of current user
export const V4_FOLLOWERS = gql`
  query V4_USER_FOLLOW($userId: String!) {
    userFollows(
      where: {
        user: { OR: [{ id_eq: $userId }, { username_eq: $userId }, { usernameNfts_some: { name_eq: $userId } }] }
      }
    ) {
      follower {
        id
        avatar
        username
        isVerified
        nameColor
        checkMarkIcon
        verifiedAt
      }
    }
  }
`
// current user following
export const V4_FOLLOWING = gql`
  query V4_FOLLOWS_USER($followerId: String!) {
    userFollows(
      where: {
        follower: {
          OR: [{ id_eq: $followerId }, { username_eq: $followerId }, { usernameNfts_some: { name_eq: $followerId } }]
        }
      }
    ) {
      user {
        id
        avatar
        username
        isVerified
        nameColor
        checkMarkIcon
        verifiedAt
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

export const useFollow = (userId, username = null, isFollowed = false) => {
  const { account } = useWallet()
  const { signWallet } = useSignWallet()
  const t = useTranslations()

  const followFn = useCallback(async () => {
    const { followUser } = await v4Client.request(
      V4_FOLLOW,
      {
        followerId: account.toLowerCase(),
        userId: userId.toLowerCase(),
      },
      {
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
      },
    )

    if (followUser) {
      await mutateSWR('current-user-follow')
      await mutateSWR(['followers', userId])
      await mutateSWR(['following', account.toLowerCase()])
      if (followUser.state === 'inserted') {
        successToast(
          t('You successfully followed', { user: username || userId.toLowerCase() }),
          null,
          ChainId.BSC,
          null,
          false,
        )
        return
      }
      successToast(
        t('You successfully unfollowed', { user: username || userId.toLowerCase() }),
        null,
        ChainId.BSC,
        null,
        false,
      )
    } else {
      if (isFollowed) {
        errorToast(t('Error unfollowing', { user: username || userId.toLowerCase() }), undefined, null, false)
        return
      }
      errorToast(t('Error following', { user: username || userId.toLowerCase() }), undefined, null, false)
    }
  }, [account, isFollowed, t, userId, username])

  const follow = useCallback(
    callback => actionWithAuthentication(followFn, signWallet, {}, callback, callback),
    [followFn, signWallet],
  )
  return { followUser: follow }
}
