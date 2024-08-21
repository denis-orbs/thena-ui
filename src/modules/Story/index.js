import { gql } from 'graphql-request'

import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'

const V4_CAMPAIGN_PARTICIPANT_BY_ID = gql`
  query V4_CAMPAIGN_PARTICIPANT_BY_ID($id_eq: String = "") {
    campaignParticipants(where: { id_eq: $id_eq }) {
      country
      email
      id
      rank
      referralCode
      avatarUrl
      totalFragments
      totalPoints
      xProfileUsername
    }
  }
`

export const fetchTHEStoryParticipant = async user => {
  try {
    const { campaignParticipants } = await v4Client.request(V4_CAMPAIGN_PARTICIPANT_BY_ID, {
      id_eq: String(user).toLowerCase(),
    })
    if (campaignParticipants && Array.isArray(campaignParticipants) && campaignParticipants.length) {
      return campaignParticipants[0]
    }
    return null
  } catch (error) {
    return { error: true }
  }
}

const V4_CAMPAIGN_PARTICIPANT_REFERRALS = gql`
  query V4_CAMPAIGN_PARTICIPANT_REFERRALS($id_eq: String = "") {
    campaignParticipantReferrals(where: { user: { id_eq: $id_eq } }) {
      id
      invitedWallet
      isSuccess
    }
  }
`

export const V4_UPDATE_PARTICIPANT_PROFILE = gql`
  mutation V4_UPDATE_PARTICIPANT_PROFILE(
    $country: String = ""
    $email: String = ""
    $referralText: String = ""
    $xProfileUsername: String = ""
    $participantId: String
  ) {
    updateParticipantProfile(
      input: { country: $country, email: $email, referralText: $referralText, xProfileUsername: $xProfileUsername }
      participantId: $participantId
    ) {
      country
      email
      xProfileUsername
    }
  }
`

export const fetchTHEStoryParticipantReferrals = async user => {
  try {
    const { campaignParticipantReferrals } = await v4Client.request(V4_CAMPAIGN_PARTICIPANT_REFERRALS, {
      id_eq: String(user).toLowerCase(),
    })

    if (campaignParticipantReferrals && Array.isArray(campaignParticipantReferrals)) {
      return campaignParticipantReferrals
    }
    return []
  } catch (error) {
    return {
      error: true,
    }
  }
}

export const V4_GENERATE_AVATAR_PROFILE_URL = gql`
  mutation V4_GENERATE_AVATAR_PROFILE_URL($fileName: String!, $fileType: String!, $userId: String!) {
    generatePresignedUrl(input: { fileName: $fileName, fileType: $fileType, userId: $userId, type: CUSTOM_AVATAR }) {
      signedRequest
      url
    }
  }
`

export const generateUrlUpload = async ({ file, userId }) => {
  const {
    generatePresignedUrl: { signedRequest, url },
  } = await v4Client.request(
    V4_GENERATE_AVATAR_PROFILE_URL,
    {
      fileName: file.name,
      fileType: file.type,
      userId,
    },
    {
      authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
    },
  )

  if (signedRequest && url) {
    const { status, statusText } = await fetch(signedRequest, {
      method: 'PUT',
      body: file,
      redirect: 'follow',
      headers: {
        'Content-Type': file.type,
      },
    })
    if (status !== 200) {
      throw new Error(statusText)
    } else {
      return url
    }
  }
  return null
}
