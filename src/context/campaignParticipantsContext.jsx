import { gql } from 'graphql-request'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'
import useWallet from '@/lib/wallets/useWallet'

const V4_CAMPAIGN_PARTICIPANT = gql`
  query V4_CAMPAIGN_PARTICIPANT($id: String = "") {
    campaignParticipants(where: { id_eq: $id }) {
      country
      email
      xProfileUsername
      rank
      totalPoints
      totalFragments
      referralCode
      referralText
      createdAt
    }
  }
`

const fetchCampaignParticipant = async id => {
  try {
    const { users: campaignParticipants } = await v4Client.request(V4_CAMPAIGN_PARTICIPANT, { id: id.toLowerCase() })

    if (campaignParticipants.length === 1) {
      const user = campaignParticipants[0]

      return {
        user,
      }
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

  const { data: userInfo, mutate: mutateUserInfo, isLoading } = useSWR(['fetchUserInfo', account])

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

  const mainRef = useRef()

  useEffect(() => {
    const { current } = mainRef

    if (current) {
      if (userInfo?.theme) {
        current.style.backgroundImage = `url(${userInfo.theme})`
      } else {
        current.style.backgroundImage = 'url(/images/background.png)'
      }
    }

    // set localStorage timezone
    if (userInfo?.timezone) {
      localStorage.setItem('timezone', userInfo.timezone)
    } else {
      localStorage.removeItem('timezone')
    }
  }, [userInfo?.theme, userInfo])

  return <UserInfoContext.Provider value={final}> {children} </UserInfoContext.Provider>
}

const useUserInfo = () => {
  const { userInfo, isLoading, mutateUserInfo } = useContext(UserInfoContext)

  return {
    userInfo,
    isLoading,
    mutateUserInfo,
  }
}

export { fetchCampaignParticipant as fetchUserInfo, UserInfoContext, UserInfoContextProvider, useUserInfo }
