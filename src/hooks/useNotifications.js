import { gql } from 'graphql-request'

import { v4Client } from '@/lib/graphql'

// follower of current user
export const V4_NOTIFICATIONS = gql`
  query UserNotifications($userId: String!) {
    notifications(where: { user: { id_eq: $userId } }) {
      id
      isSent
      content
      timestamp
      redirectUrl
    }
  }
`

export const V4_NEW_NOTIFICATION_SUBSCRIPTION = gql`
  subscription UserNewNotification($userId: String!) {
    newNotification(userId: $userId) {
      id
      isSent
      content
      timestamp
      redirectUrl
    }
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
