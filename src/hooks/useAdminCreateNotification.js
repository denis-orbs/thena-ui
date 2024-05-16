import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
import { actionWithAuthentication, useSignWallet } from '@/lib/wallets/useSignWallet'

const V4_CREATE_NOTIFICATION = gql`
  mutation V4_CREATE_NOTIFICATION($content: String, $recipients: [String!], $redirectUrl: String) {
    sendGeneralNotification(input: { content: $content, recipients: $recipients, redirectUrl: $redirectUrl })
  }
`
export const createNotification = async (recipients, content, redirectUrl) => {
  const res = await v4Client.request(
    V4_CREATE_NOTIFICATION,
    { recipients, content, redirectUrl },
    {
      authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
    },
  )

  if (res?.response?.errors) {
    throw new Error(res?.response?.errors?.[0]?.message)
  }
}

export const useCreateNotification = () => {
  const { signWallet } = useSignWallet()

  const createNotificationFn = useCallback(
    async ({ recipients, content, redirectUrl }) => await createNotification(recipients, content, redirectUrl),
    [],
  )

  const adminCreateNotification = useCallback(
    async ({ recipients, content, redirectUrl }, callOnSuccess) => {
      actionWithAuthentication(createNotificationFn, signWallet, { recipients, content, redirectUrl }, callOnSuccess)
    },
    [createNotificationFn, signWallet],
  )

  return {
    adminCreateNotification,
  }
}
