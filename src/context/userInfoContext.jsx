import { gql } from 'graphql-request'
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'
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
      balance
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
    const { userById } = await v4Client.request(V4_USER_INFO, { id: id.toLowerCase() })

    const { tradeRankByAddress } = await v4Client.request(V4_USER_RANK, { id: id.toLowerCase() })

    return { ...userById, rank: tradeRankByAddress?.[0]?.rank ?? '-' }
  } catch (error) {
    return { error: true }
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
  } = useSWR(['current user info', account?.toLowerCase()], () => fetchUserInfo(account?.toLowerCase()), {
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

  return <UserInfoContext.Provider value={final}>{children}</UserInfoContext.Provider>
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
