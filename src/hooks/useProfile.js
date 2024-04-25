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
    $website: String
    $xProfile: String
    $timezone: String
    $theme: String
    $id: String!
  ) {
    updateUserProfile(
      input: {
        isPublicProfile: $isPublicProfile
        avatar: $avatar
        biography: $biography
        nameColor: $nameColor
        theme: $theme
        username: $username
        websiteUrl: $website
        xProfileUrl: $xProfile
        timezone: $timezone
      }
      userId: $id
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
          input: {
            biography,
            avatar,
            nameColor,
            theme,
            timezone,
            username,
            websiteUrl,
            xProfileUrl,
            isPublicProfile,
          },
          id: account.toLocaleLowerCase(),
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
