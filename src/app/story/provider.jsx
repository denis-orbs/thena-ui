'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useSpaceIdBNB } from '@/hooks/useSpaceIdBNB'
import useWallet from '@/hooks/useWallet'
import { isoDateToTimeStampSeconds } from '@/lib/utils'
import { fetchCampaignChapter, fetchTHEStoryParticipant } from '@/modules/Story'

const THEStoryContext = createContext({
  campaignStartsAt: 1725278400, // 2024-09-02 12:00 UTC
  isRegistered: false,
  setIsRegistered: () => false,
  campaignParticipantInfo: null,
  setCampaignParticipantInfo: () => {},
  isUpcoming: false,
})

function THEStoryContextProvider({ children }) {
  const { account } = useWallet()

  const [isRegistered, setIsRegistered] = useState(false)
  const [campaignParticipantInfo, setCampaignParticipantInfo] = useState(null)
  const [isUpcoming, setIsUpcoming] = useState(false)
  const [campaignStartsAt, setCampaignStartsAt] = useState(1725278400) // 2024-09-02 12:00 UTC
  const { spaceIdName } = useSpaceIdBNB(account)

  useEffect(() => {
    const checkCampaignStartsAt = async () => {
      try {
        const firstChapter = await fetchCampaignChapter(1)
        if (firstChapter) {
          const { startTimestamp } = firstChapter
          if (startTimestamp) {
            const timestampInSeconds = isoDateToTimeStampSeconds(startTimestamp)
            setCampaignStartsAt(timestampInSeconds)
          }
        }
      } catch (e) {
        console.log(e)
      }
    }

    checkCampaignStartsAt()
  }, [])

  useEffect(() => {
    const checkTime = () => {
      const newIsUpcoming = Date.now() / 1000 < campaignStartsAt
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
            setCampaignParticipantInfo({
              ...user,
              participant: {
                ...user?.participant,
                spaceIdName,
              },
            })
          } else {
            setIsRegistered(false)
            setCampaignParticipantInfo(null)
          }
        } catch (error) {
          setIsRegistered(false)
          setCampaignParticipantInfo(null)
          console.log(error)
        }
      } else {
        setIsRegistered(false)
        setCampaignParticipantInfo(null)
      }
    }

    checkUserIsRegistered()
  }, [account, spaceIdName])

  const value = useMemo(
    () => ({
      campaignStartsAt,
      isRegistered,
      setIsRegistered,
      campaignParticipantInfo,
      setCampaignParticipantInfo,
      isUpcoming,
    }),
    [campaignStartsAt, isRegistered, campaignParticipantInfo, setCampaignParticipantInfo, isUpcoming],
  )

  return <THEStoryContext.Provider value={value}>{children}</THEStoryContext.Provider>
}

const useTHEStory = () => {
  const THEStory = useContext(THEStoryContext)
  return THEStory
}

export { THEStoryContext, THEStoryContextProvider, useTHEStory }
