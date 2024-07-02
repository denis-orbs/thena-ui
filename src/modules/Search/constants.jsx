import { gql } from 'graphql-request'

export const TYPE_SEE = {
  ALL: 'all',
  USER: 'user',
  TC: 'TC',
}

export const V4_USERS_COMPETITIONS = gql`
  query V4_USERS_COMPETITIONS($search: String!) {
    tradingCompetitions(where: { name_containsInsensitive: $search }) {
      id
      name
      bannerUrl
      defaultBannerUrl
      timestamp {
        endTimestamp
        registrationEnd
        registrationStart
        startTimestamp
      }
      market
      prizeUpdate {
        ownerFee
        token
        totalPrize
        weights
        winType
      }
      owner {
        id
        isVerified
        avatar
        username
        nameColor
        checkMarkIcon
        verifiedAt
      }
    }
  }
`

export const V4_USERS_COUNT = gql`
  query V4_USERS_COUNT($search: String!) {
    usersTotalCount(q: $search)
  }
`

export const V4_USERS_SEARCH = gql`
  query V4_USERS_SEARCH($search: String!, $limit: Int = 3, $offset: Int = 1) {
    users(
      where: { OR: [{ id_containsInsensitive: $search }, { username_containsInsensitive: $search }] }
      limit: $limit
      offset: $offset
      orderBy: [isSuperAdmin_DESC, isAdmin_DESC, isVerified_DESC]
    ) {
      id
      isVerified
      username
      nameColor
      avatar
      isAdmin
      isSuperAdmin
      checkMarkIcon
      verifiedAt
    }
  }
`
