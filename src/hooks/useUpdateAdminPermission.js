import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
import { actionWithAuthentication, useSignWallet } from '@/lib/wallets/useSignWallet'

const V4_UPDATE_USER = gql`
  mutation ($userId: String!, $isAdmin: Boolean!) {
    updateAdminPermission(input: { isAdmin: $isAdmin }, userId: $userId) {
      id
      isAdmin
    }
  }
`

export const useUpdateAdminPermission = () => {
  const { signWallet } = useSignWallet()

  const updateAdminPermissionFn = useCallback(async ({ userId, isAdmin }) => {
    const data = await v4Client.request(
      V4_UPDATE_USER,
      { userId, isAdmin },
      {
        authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
      },
    )

    return data?.updateAdminPermission
  }, [])

  const updateAdminPermission = useCallback(
    async (userId, isAdmin, callOnSuccess) => {
      await actionWithAuthentication(updateAdminPermissionFn, signWallet, { userId, isAdmin }, callOnSuccess)
    },
    [signWallet, updateAdminPermissionFn],
  )

  return { updateAdminPermission }
}
