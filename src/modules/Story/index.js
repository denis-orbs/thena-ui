import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { successToast } from '@/lib/notify'

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

// const V4_CAMPAIGN_PARTICIPANT_LIST = gql`
//   query V4_CAMPAIGN_PARTICIPANT_LIST (
//     $limit: Int = 10,
//     $orderBy: String = 'rank_ASC',
//     $offset: Int = 1,
//     $id_not_contains: String
//     ) {
//       campaignParticipants(
//         limit: $limit,
//         orderBy: $orderBy,
//         offset: $offset,
//         where: {id_not_contains:  $id_not_contains}
//         ) {
//           id
//           email
//           rank
//         }
//     }
// `

export const fetchTHEStoryParticipant = async user => {
  const { campaignParticipants } = await v4Client.request(V4_CAMPAIGN_PARTICIPANT_BY_ID, {
    id_eq: String(user).toLowerCase(),
  })
  if (campaignParticipants && Array.isArray(campaignParticipants) && campaignParticipants.length) {
    return campaignParticipants[0]
  }
  return null
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
    console.log(error)
    // errorToast(error.errors)
  }
}

export const V4_UPDATE_PARTICIPANT_PROFILE = gql`
  mutation V4_UPDATE_PARTICIPANT_PROFILE(
    $avatarUrl: String = ""
    $country: String = ""
    $email: String = ""
    $xProfileUsername: String = ""
  ) {
    updateParticipantProfile(
      input: { avatarUrl: $avatarUrl, country: $country, email: $email, xProfileUsername: $xProfileUsername }
    ) {
      avatarUrl
      country
      email
      referralCode
      referralText
      xProfileUsername
    }
  }
`

export const useUpdateParticipantProfile = () => {
  const { signWallet } = useSignWallet()

  const updateParticipantProfileFn = useCallback(async ({ avatarUrl, country, email, xProfileUsername }) => {
    const { updateParticipantProfile } = await v4Client.request(
      V4_UPDATE_PARTICIPANT_PROFILE,
      {
        avatarUrl,
        country,
        email,
        xProfileUsername,
      },
      {
        authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
      },
    )

    if (updateParticipantProfile) {
      successToast('Successfully')

      return updateParticipantProfile
    }
    return false
  }, [])

  const updateParticipantProfile = useCallback(
    (params, callOnSuccess) => actionWithAuthentication(updateParticipantProfileFn, signWallet, params, callOnSuccess),
    [updateParticipantProfileFn, signWallet],
  )

  return { updateParticipantProfile, updateParticipantProfileFn }
}

export const V4_GENERATE_AVATAR_PROFILE_URL = gql`
  mutation V4_GENERATE_AVATAR_PROFILE_URL($fileName: String!, $fileType: String!, $userId: String!) {
    generatePresignedUrl(input: { fileName: $fileName, fileType: $fileType, userId: $userId, type: CUSTOM_AVATAR }) {
      signedRequest
      url
    }
  }
`

export const useCreateParticipantAvatarUploadUrl = () => {
  const { signWallet } = useSignWallet()
  const createPresignUrlFn = useCallback(async ({ file, userId }) => {
    console.log({ file })
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
  }, [])

  const createPresignUrl = useCallback(
    (file, userId, callOnSuccess) =>
      actionWithAuthentication(createPresignUrlFn, signWallet, { file, userId }, callOnSuccess),
    [createPresignUrlFn, signWallet],
  )

  return { createPresignUrlFn, createPresignUrl }
}
