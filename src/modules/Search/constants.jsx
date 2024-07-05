import { gql } from 'graphql-request'

export const TYPE_SEE = {
  ALL: 'all',
  USER: 'user',
  THENA_ID: 'thenaId',
  TC: 'TC',
}

export const PAGE_SIZE = 30

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
  query V4_USERS_SEARCH($search: String!, $limit: Int = 3, $offset: Int = 0) {
    users(
      where: {
        AND: [
          { isContract_eq: false }
          { OR: [{ id_containsInsensitive: $search }, { username_containsInsensitive: $search }] }
        ]
      }
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
export const V4_MINTED_ID_SEARCH = gql`
  query V4_MINTED_ID_SEARCH($search: String!, $limit: Int = 2, $offset: Int = 0) {
    usernameNfts(
      where: { AND: [{ name_not_eq: $search }, { name_containsInsensitive: $search }] }
      limit: $limit
      offset: $offset
    ) {
      id
      name
      imageUrl
      owner {
        username
        avatar
        id
        checkMarkIcon
        verifiedAt
        isVerified
      }
    }
  }
`

export const V4_ID_SEARCH = gql`
  query V4_ID_SEARCH($search: String!) {
    usernameNfts(where: { name_eq: $search }) {
      id
      name
      imageUrl
      owner {
        username
        avatar
        id
        checkMarkIcon
        verifiedAt
        isVerified
      }
    }
  }
`

export const V4_ID_COUNT = gql`
  query V4_ID_COUNT($search: String!) {
    usernameNftsCountForSearch(where: { name_contains: $search, name_not_eq: $search })
  }
`
