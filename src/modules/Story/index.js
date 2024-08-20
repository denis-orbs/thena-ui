import { gql } from 'graphql-request'

import { v4Client } from '@/lib/graphql'

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
