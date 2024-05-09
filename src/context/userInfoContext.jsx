import { gql } from 'graphql-request'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
import useWallet from '@/lib/wallets/useWallet'

const V4_USER_RANK = gql`
  query V4_UER_RANK($id: String!) {
    tradeRankByAddress(address: $id) {
      rank
    }
  }
`

const V4_USER_BY_ID_OR_USERNAME = gql`
  query GetUserByIdOrUsername($idOrUserName: String!) {
    users(
      where: {
        OR: [
          { username_eq: $idOrUserName }
          { id_eq: $idOrUserName }
          { usernameNfts_some: { name_eq: $idOrUserName } }
        ]
      }
      limit: 1
    ) {
      id
      firstInteractAt
      biography
      timezone
      websiteUrl
      xProfileUrl
      username
      theme
      nameColor
      avatar
      balance
      isSuperAdmin
      checkMarkIcon
      verifiedAt
      isAdmin
      isVerified
      tradingCompetitions {
        name
        entryFee
        market
        id
        competitionRules {
          winningToken
          tradingTokens
          startingBalance
        }
        prize {
          totalPrize
          token
          weights
        }
        timestamp {
          endTimestamp
          startTimestamp
          registrationStart
          registrationEnd
        }
        participants {
          id
          participant {
            id
          }
        }
        maxParticipants
        participantCount
        owner {
          id
          isVerified
          avatar
          username
          checkMarkIcon
          verifiedAt
          nameColor
        }
        tradingCompetitionSpot
      }
      joinedTCs {
        tradingCompetition {
          name
          entryFee
          market
          id
          competitionRules {
            winningToken
            tradingTokens
            startingBalance
          }
          prize {
            totalPrize
            token
            weights
          }
          timestamp {
            endTimestamp
            startTimestamp
            registrationStart
            registrationEnd
          }
          participants {
            id
            participant {
              id
            }
          }
          maxParticipants
          participantCount
          owner {
            id
            isVerified
            avatar
            username
            checkMarkIcon
            verifiedAt
            nameColor
          }
          tradingCompetitionSpot
        }
      }
      thenianNfts {
        meatadata {
          image
        }
        id
      }
      usernameNfts {
        name
        id
      }
    }
  }
`

const fetchUserInfo = async idOrUserName => {
  try {
    const { users } = await v4Client.request(
      V4_USER_BY_ID_OR_USERNAME,
      { idOrUserName: idOrUserName.toLowerCase() },
      {
        authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
      },
    )

    if (users.length === 1) {
      const user = users[0]
      const { tradeRankByAddress } = await v4Client.request(V4_USER_RANK, { id: user.id.toLowerCase() })

      return { ...user, rank: tradeRankByAddress?.[0]?.rank ?? '-' }
    }
    return undefined
  } catch (error) {
    return undefined
  }
}

const initialState = {
  mutateUserInfo: () => {},
  userInfo: undefined,
  isLoading: false,
}

const UserInfoContext = createContext(initialState)

function UserInfoContextProvider({ children }) {
  const { account } = useWallet()

  const {
    data: userInfo,
    mutate: mutateUserInfo,
    isLoading,
  } = useSWR(['current user info'], () => fetchUserInfo(account?.toLowerCase()), {
    refreshInterval: 60000,
  })

  const final = useMemo(() => {
    if (!userInfo || !account) {
      return {
        mutateUserInfo: () => {},
        userInfo: undefined,
        isLoading,
      }
    }
    // set localStorage timezone

    if (userInfo.timezone) {
      localStorage.setItem('timezone', userInfo.timezone)
    }

    return {
      mutateUserInfo,
      userInfo,
      isLoading,
    }
  }, [account, userInfo, mutateUserInfo, isLoading])

  const mutateData = useCallback(async () => {
    if (account) {
      await mutateUserInfo()
    }
  }, [account, mutateUserInfo])

  useEffect(() => {
    mutateData()
  }, [mutateData])

  const mainRef = useRef()

  useEffect(() => {
    const { current } = mainRef

    if (userInfo?.theme && current) {
      current.style.backgroundImage = `url(${userInfo.theme})`
    }
  }, [userInfo?.theme, userInfo])

  return (
    <UserInfoContext.Provider value={final}>
      <main className='desktop-bg flex min-h-screen flex-col' ref={mainRef}>
        {children}
      </main>
    </UserInfoContext.Provider>
  )
}

const useUserInfo = () => {
  const { userInfo, isLoading, mutateUserInfo } = useContext(UserInfoContext)

  return {
    userInfo,
    isLoading,
    mutateUserInfo,
  }
}

export { fetchUserInfo, UserInfoContext, UserInfoContextProvider, useUserInfo }
