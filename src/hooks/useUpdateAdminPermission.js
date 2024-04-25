import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
import { errorToast } from '@/lib/notify'

const V4_UPDATE_USER = gql`
  mutation ($userId: String!, $isAdmin: Boolean!) {
    updateAdminPermission(input: { isAdmin: $isAdmin }, userId: $userId) {
      id
      isAdmin
    }
  }
`

export const useUpdateAdminPermission = () => {
  const updateAdminPermission = useCallback(async ({ userId, isAdmin }) => {
    try {
      const data = await v4Client.request(
        V4_UPDATE_USER,
        { userId, isAdmin },
        {
          authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
        },
      )

      return data?.updateAdminPermission
    } catch (error) {
      errorToast('Error', error?.shortMessage)
    }
  }, [])

  return { updateAdminPermission }
}
