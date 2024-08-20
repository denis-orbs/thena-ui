import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import useWallet from '@/lib/wallets/useWallet'
import { fetchTHEStoryParticipant } from '@/modules/Story'

dayjs.extend(utc)

const THEStoryContext = createContext({
  // campaignStartsAt: dayjs.utc('2024-09-01'),
  campaignStartsAt: dayjs.utc('2024-08-20'),
  isRegistered: false,
  campaignParticipantInfo: null,
  isUpcoming: true,
})

function THEStoryContextProvider({ children }) {
  const { account } = useWallet()

  const [isRegistered, setIsRegistered] = useState(false)
  const [campaignParticipantInfo, setCampaignParticipantInfo] = useState(null)
  const [isUpcoming, setIsUpcoming] = useState(true)
  // const campaignStartsAt = useMemo(() => dayjs.utc('2024-09-01'), [])
  const campaignStartsAt = useMemo(() => dayjs.utc('2024-08-20'), [])

  useEffect(() => {
    const checkTime = () => {
      const newIsUpcoming = dayjs().isBefore(campaignStartsAt)
      setIsUpcoming(prev => {
        if (prev !== newIsUpcoming) {
          return newIsUpcoming
        }
        return prev
      })
    }

    checkTime()

    const intervalId = setInterval(checkTime, 1000)

    if (!isUpcoming) {
      clearInterval(intervalId)
    }

    return () => clearInterval(intervalId)
  }, [campaignStartsAt, isUpcoming])

  useEffect(() => {
    const checkUserIsRegistered = async () => {
      if (account) {
        try {
          const user = await fetchTHEStoryParticipant(account)

          if (user) {
            setIsRegistered(true)
            setCampaignParticipantInfo(user)
          }
        } catch (error) {
          console.log(error)
        }
      } else {
        setIsRegistered(false)
        setCampaignParticipantInfo(null)
      }
    }

    checkUserIsRegistered()
  }, [account])

  const value = useMemo(
    () => ({
      campaignStartsAt,
      isRegistered,
      setIsRegistered,
      campaignParticipantInfo,
      setCampaignParticipantInfo,
      isUpcoming,
    }),
    [campaignStartsAt, isRegistered, campaignParticipantInfo, isUpcoming],
  )

  return <THEStoryContext.Provider value={value}>{children}</THEStoryContext.Provider>
}

const useTHEStory = () => {
  const THEStory = useContext(THEStoryContext)
  return THEStory
}

export { THEStoryContext, THEStoryContextProvider, useTHEStory }
