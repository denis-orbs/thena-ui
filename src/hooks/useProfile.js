import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { v4Client } from '@/lib/graphql'
import { errorToast } from '@/lib/notify'
import { useSignWallet } from '@/lib/wallets/useSignWallet'
import useWallet from '@/lib/wallets/useWallet'

const V4_UPDATE_PROFILE = gql`
  mutation V4_MUTATION_FOLLOW(
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
      id: $id
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

export const useUpdateProfile = () => {
  const { account } = useWallet()
  const { token } = useSignWallet()

  const updateProfile = useCallback(
    async ({ biography, avatar, nameColor, theme, timezone, username, websiteUrl, xProfileUrl, isPublicProfile }) => {
      try {
        const { data } = await v4Client.setHeader('authorization', token).request(
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
            authorization: token,
          },
        )

        return data?.updateUserProfile
      } catch (error) {
        errorToast('Error', error?.shortMessage)
      }
    },
    [account, token],
  )

  return { updateProfile }
}
