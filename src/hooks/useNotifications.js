import { gql, GraphQLWebSocketClient } from 'graphql-request'
import { useCallback, useEffect, useRef, useState } from 'react'

import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import useWallet from '@/hooks/useWallet'
import { v4Client, v4GraphWsUrl } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'

// follower of current user
export const V4_NOTIFICATIONS = gql`
  query UserNotifications($userId: String!) {
    notifications(orderBy: timestamp_DESC, where: { user: { id_eq: $userId }, isSent_eq: true }) {
      content
      id
      isRead
      isSent
      redirectUrl
      timestamp
      type
      userTrigger {
        id
        avatar
        checkMarkIcon
        isVerified
        nameColor
        username
      }
    }
  }
`

const NEW_NOTIFICATION_SUB = gql`
  subscription NewNotificationSubscription($userId: String!) {
    newNotification(userId: $userId) {
      content
      timestamp
    }
  }
`

const MARK_AS_READ = gql`
  mutation ReadNotification($id: String) {
    readNotifications(id: $id)
  }
`
const CLICK_NOTIFICATION = gql`
  mutation CLICK_NOTIFICATION($id: String!) {
    clickNotification(id: $id)
  }
`

export const fetchUserNotifcations = async id => {
  try {
    const { notifications } = await v4Client.request(V4_NOTIFICATIONS, { userId: id.toLowerCase() })

    return notifications
  } catch (error) {
    return undefined
  }
}

export function useNotificationsSubscription(callback) {
  const { account } = useWallet()
  const [client, setClient] = useState()
  const [socketState, setSocketState] = useState(WebSocket.CONNECTING)

  const unSubscribeRef = useRef()

  useEffect(() => {
    const newSocket = new WebSocket(v4GraphWsUrl, 'graphql-transport-ws')
    setClient(new GraphQLWebSocketClient(newSocket, {}))
    newSocket.onopen = () => {
      setSocketState(WebSocket.OPEN)
    }
    newSocket.onclose = () => {
      setSocketState(WebSocket.CLOSED)
    }

    return () => {
      newSocket.close()
    }
  }, [])

  useEffect(() => {
    if (account && client && socketState === WebSocket.OPEN) {
      if (unSubscribeRef.current) {
        unSubscribeRef.current()
      }
      const unsubscribe = client.subscribe(
        NEW_NOTIFICATION_SUB,
        {
          next: callback,
          error: error => console.log(error),
        },
        {
          userId: account.toLowerCase(),
        },
      )
      unSubscribeRef.current = unsubscribe
    }

    if (!account && unSubscribeRef.current) {
      unSubscribeRef.current()
      unSubscribeRef.current = undefined
    }
    return unSubscribeRef.current
  }, [account, callback, client, socketState])
}

export function useMarkNotificationRead() {
  const { signWallet } = useSignWallet()
  const markReadFn = useCallback(async ({ id, type }) => {
    if (type === 'general' && id) {
      await v4Client.request(
        CLICK_NOTIFICATION,
        { id },
        {
          authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
        },
      )
    }
    await v4Client.request(
      MARK_AS_READ,
      { id },
      {
        authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
      },
    )
  }, [])

  const markRead = useCallback(
    async (id, type) => {
      await actionWithAuthentication(markReadFn, signWallet, { id, type })
    },
    [markReadFn, signWallet],
  )
  return {
    markRead,
  }
}
