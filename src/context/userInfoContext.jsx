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

const V4_USER_INFO = gql`
  query V4_USER($id: String!) {
    userById(id: $id) {
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

const fetchUserInfo = async id => {
  try {
    const { userById } = await v4Client.request(
      V4_USER_INFO,
      { id: id.toLowerCase() },
      {
        authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
      },
    )

    const { tradeRankByAddress } = await v4Client.request(V4_USER_RANK, { id: id.toLowerCase() })

    return { ...userById, rank: tradeRankByAddress?.[0]?.rank ?? '-' }
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
  const { userInfo, isLoading } = useContext(UserInfoContext)

  return {
    userInfo,
    isLoading,
  }
}

const useMutateUserInfo = () => {
  const { mutateUserInfo } = useContext(UserInfoContext)
  return mutateUserInfo
}

export { fetchUserInfo, useMutateUserInfo, UserInfoContext, UserInfoContextProvider, useUserInfo }
