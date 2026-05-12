import { gql } from 'graphql-request'
import { useCallback, useState } from 'react'

import { ThenaAuthToken } from '@/constant'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { ArenaClient } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { successToast } from '@/lib/notify'

const V4_UPDATE_ARENA_PROFILE = gql`
  mutation V4_UPDATE_PROFILE(
    $isPublicProfile: Boolean
    $biography: String
    $nameColor: String
    $username: String
    $websiteUrl: String
    $xProfileUrl: String
    $theme: String
    $userId: String
    $avatar: String
  ) {
    updateUserProfile(
      input: {
        isPublicProfile: $isPublicProfile
        biography: $biography
        nameColor: $nameColor
        theme: $theme
        username: $username
        websiteUrl: $websiteUrl
        xProfileUrl: $xProfileUrl
        avatar: $avatar
      }
      userId: $userId
    ) {
      id
      biography
      avatar
      nameColor
      theme
      username
      websiteUrl
      xProfileUrl
      isPublicProfile
    }
  }
`
export const useUpdateArenaProfile = account => {
  const { signWallet } = useSignWallet()

  const updateProfileFn = useCallback(
    async ({ biography, avatar, nameColor, theme, username, websiteUrl, xProfileUrl, isPublicProfile }) => {
      const { updateUserProfile } = await ArenaClient.request(
        V4_UPDATE_ARENA_PROFILE,
        {
          biography,
          avatar,
          nameColor,
          theme,
          username,
          websiteUrl,
          xProfileUrl,
          isPublicProfile,
          userId: account?.toLowerCase() ?? null,
        },
        {
          authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
        },
      )
      if (updateUserProfile) {
        successToast('Successfully')

        return updateUserProfile
      }
      return false
    },
    [account],
  )

  const updateArenaProfile = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(updateProfileFn, signWallet, params, callOnSuccess, callOnReject),
    [updateProfileFn, signWallet],
  )

  return { updateArenaProfile }
}

const V4_UPDATE_ARENA_AVATAR = gql`
  mutation V4_UPDATE_ARENA_AVATAR($avatar: String, $userId: String) {
    updateUserProfile(input: { avatar: $avatar }, userId: $userId) {
      id
      biography
      avatar
      nameColor
      theme
      username
      websiteUrl
      xProfileUrl
      isPublicProfile
    }
  }
`
export const useUpdateArenaAvatar = account => {
  const { signWallet } = useSignWallet()

  const updateArenaAvatarFn = useCallback(
    async avatar => {
      const { updateUserProfile } = await ArenaClient.request(
        V4_UPDATE_ARENA_AVATAR,
        {
          avatar,
          userId: account?.toLowerCase() ?? null,
        },
        {
          authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
        },
      )

      if (updateUserProfile) {
        successToast('Successfully')

        return updateUserProfile
      }
      return false
    },
    [account],
  )

  const updateArenaAvatar = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(updateArenaAvatarFn, signWallet, params, callOnSuccess, callOnReject),
    [updateArenaAvatarFn, signWallet],
  )

  return { updateArenaAvatar }
}

const V4_UPDATE_ARENA_CHECKMARK = gql`
  mutation V4_UPDATE_ARENA_CHECKMARK($checkMarkIcon: String, $userId: String!) {
    updateCheckMarkIcon(checkMarkIcon: $checkMarkIcon, userId: $userId) {
      id
      checkMarkIcon
    }
  }
`
export const useUpdateArenaCheckmarkIcon = () => {
  const { signWallet } = useSignWallet()

  const updateArenacheckMarkIconFn = useCallback(async ({ checkMarkIcon, userId }) => {
    const res = await ArenaClient.request(
      V4_UPDATE_ARENA_CHECKMARK,
      {
        checkMarkIcon,
        userId,
      },
      {
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
      },
    )

    if (res?.response?.errors) {
      throw new Error(res?.response?.errors?.[0]?.message)
    }

    return res?.updateCheckMarkIcon
  }, [])

  const updateArenacheckMarkIcon = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(updateArenacheckMarkIconFn, signWallet, params, callOnSuccess, callOnReject),
    [updateArenacheckMarkIconFn, signWallet],
  )

  return { updateArenacheckMarkIcon }
}

const V4_UPDATE_USER_IS_ADMIN = gql`
  mutation V4_UPDATE_USER_IS_ADMIN($userId: String!, $isAdmin: Boolean!) {
    updateAdminPermission(input: { isAdmin: $isAdmin }, userId: $userId) {
      id
      isAdmin
    }
  }
`
export const useUpdateUserIsAdmin = () => {
  const { signWallet } = useSignWallet()

  const updateIsAdminFn = useCallback(async ({ isAdmin, userId }) => {
    const { data: res } = await ArenaClient.request(
      V4_UPDATE_USER_IS_ADMIN,
      {
        isAdmin,
        userId,
      },
      {
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
      },
    )
    return res
  }, [])

  const updateUserIsAdmin = useCallback(
    async (params, callOnSuccess, callOnReject) => {
      await actionWithAuthentication(updateIsAdminFn, signWallet, params, callOnSuccess, callOnReject)
    },
    [signWallet, updateIsAdminFn],
  )

  return { updateUserIsAdmin }
}

const V4_UPDATE_USER_IS_VERIFIED = gql`
  mutation V4_UPDATE_USER_IS_VERIFIED($isVerified: Boolean!, $userId: String!) {
    updateVerifiedUser(input: { isVerified: $isVerified }, userId: $userId) {
      id
    }
  }
`
export const useUpdateUserIsVerified = () => {
  const { signWallet } = useSignWallet()

  const updateIsVerifiedFn = useCallback(async ({ isVerified, userId }) => {
    const { data: res } = await ArenaClient.request(
      V4_UPDATE_USER_IS_VERIFIED,
      {
        isVerified,
        userId,
      },
      {
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
      },
    )
    return res
  }, [])

  const updateUserIsVerified = useCallback(
    async (params, callOnSuccess, callOnReject) => {
      await actionWithAuthentication(updateIsVerifiedFn, signWallet, params, callOnSuccess, callOnReject)
    },
    [signWallet, updateIsVerifiedFn],
  )

  return { updateUserIsVerified }
}

const V4_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    users(where: { id_eq: $id }, limit: 1) {
      id
      firstInteractAt
    }
  }
`
export const useCheckUserCreated = () => {
  const { signWallet } = useSignWallet()

  const checkUserCreatedFn = useCallback(async id => {
    const { users } = await ArenaClient.request(V4_USER_BY_ID, {
      id,
    })

    if (users && users.length === 1) {
      return users
    }

    throw new Error('User not created')
  }, [])

  const checkUserCreated = useCallback(
    async (params, callOnSuccess, callOnReject) => {
      await actionWithAuthentication(checkUserCreatedFn, signWallet, params, callOnSuccess, callOnReject)
    },
    [signWallet, checkUserCreatedFn],
  )

  return { checkUserCreated }
}

const V4_THENIAN_NFTS_OWNED_AND_STAKED = gql`
  query V4_THENIAN_NFTS_OWNED_AND_STAKED($userId: String!) {
    thenianNftsStakedAndOwned(userId: $userId) {
      id
      index
      meatadata {
        image
      }
      ownerId
      timestamp
    }
  }
`

export const useThenianNftsOwnedAndStaked = userId => {
  const { signWallet } = useSignWallet()
  const [userNFTs, setUserNFTs] = useState([])

  const getThenianNftsOwnedAndStakedFn = useCallback(async () => {
    if (!userId) return []
    const { thenianNftsStakedAndOwned } = await ArenaClient.request(V4_THENIAN_NFTS_OWNED_AND_STAKED, { userId })

    if (thenianNftsStakedAndOwned && Array.isArray) {
      return thenianNftsStakedAndOwned.map(nft => ({
        ...nft,
        meatadata: {
          image: nft?.meatadata?.image,
        },
      }))
    }

    return []
  }, [userId])

  const getThenianNftsOwnedAndStaked = useCallback(
    async () => await actionWithAuthentication(getThenianNftsOwnedAndStakedFn, signWallet, {}, setUserNFTs),
    [getThenianNftsOwnedAndStakedFn, signWallet],
  )

  return {
    getThenianNftsOwnedAndStaked,
    userNFTs,
    setUserNFTs,
  }
}
