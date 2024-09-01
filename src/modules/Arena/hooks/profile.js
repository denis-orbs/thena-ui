import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { ThenaAuthToken } from '@/constant'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { successToast } from '@/lib/notify'

const V4_UPDATE_ARENA_PROFILE = gql`
  mutation V4_UPDATE_PROFILE(
    $isPublicProfile: Boolean
    $avatar: String
    $biography: String
    $nameColor: String
    $username: String
    $websiteUrl: String
    $xProfileUrl: String
    $theme: String
    $userId: String
  ) {
    updateUserProfile(
      input: {
        isPublicProfile: $isPublicProfile
        avatar: $avatar
        biography: $biography
        nameColor: $nameColor
        theme: $theme
        username: $username
        websiteUrl: $websiteUrl
        xProfileUrl: $xProfileUrl
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
      const { updateUserProfile } = await v4Client.request(
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
      const { updateUserProfile } = await v4Client.request(
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
