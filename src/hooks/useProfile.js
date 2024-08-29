import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { ThenaAuthToken } from '@/constant'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { successToast } from '@/lib/notify'

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
      const { updateUserProfile } = await v4Client.request(
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

  const updateProfile = useCallback(
    (params, callOnSuccess) => actionWithAuthentication(updateProfileFn, signWallet, params, callOnSuccess),
    [updateProfileFn, signWallet],
  )

  return { updateProfile, updateProfileFn }
}
