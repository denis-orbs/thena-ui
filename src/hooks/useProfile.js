import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
import { actionWithAuthentication, useSignWallet } from '@/lib/wallets/useSignWallet'

const V4_UPDATE_PROFILE = gql`
  mutation V4_UPDATE_PROFILE(
    $isPublicProfile: Boolean
    $avatar: String
    $biography: String
    $nameColor: String
    $username: String
    $websiteUrl: String
    $xProfileUrl: String
    $timezone: String
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
        timezone: $timezone
      }
      userId: $userId
    ) {
      id
      biography
      avatar
      nameColor
      theme
      timezone
      username
      websiteUrl
      xProfileUrl
      isPublicProfile
    }
  }
`

export const useUpdateProfile = account => {
  const { signWallet } = useSignWallet()

  const updateProfileFn = useCallback(
    async ({ biography, avatar, nameColor, theme, timezone, username, websiteUrl, xProfileUrl, isPublicProfile }) => {
      const { data } = await v4Client.request(
        V4_UPDATE_PROFILE,
        {
          biography,
          avatar,
          nameColor,
          theme,
          timezone,
          username,
          websiteUrl,
          xProfileUrl,
          isPublicProfile,
          userId: account?.toLocaleLowerCase() ?? null,
        },
        {
          authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
        },
      )

      return data?.updateUserProfile
    },
    [account],
  )

  const updateProfile = useCallback(
    params => actionWithAuthentication(updateProfileFn, signWallet, params),
    [updateProfileFn, signWallet],
  )

  return { updateProfile }
}
