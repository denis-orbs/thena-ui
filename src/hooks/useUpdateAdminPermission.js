import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'

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
        authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
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
