import { gql } from 'graphql-request'
import { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'
import useWallet from '@/lib/wallets/useWallet'

const V4_CAMPAIGN_CHAPTERS = gql`
  query V4_CAMPAIGN_CHAPTERS {
    campaignChapters {
      id
      name
      startTimestamp
      endTimestamp
    }
  }
`

const fetchCampaignChapters = async () => {
  try {
    const { campaignChapters = [] } = await v4Client.request(V4_CAMPAIGN_CHAPTERS)

    return campaignChapters
  } catch (error) {
    return undefined
  }
}

const V4_CAMPAIGN_TASKS = gql`
  query V4_CAMPAIGN_TASKS {
    campaignTasks {
      id
      chapter
      index
      name
      rewardAmount
      rewardType
      type
    }
  }
`
const fetchCampaignTasks = async () => {
  try {
    const { campaignTasks = [] } = await v4Client.request(V4_CAMPAIGN_TASKS)

    return campaignTasks
  } catch (error) {
    return undefined
  }
}

const V4_CAMPAIGN_COMPLETED_TASKS = gql`
  query MyQuery($id: String = "") {
    campaignParticipantCompleteTasks(where: { participant: { id_eq: $id } }) {
      campaignTask {
        id
        chapter
      }
    }
  }
`

const fetchCampaignCompletedTasks = async id => {
  try {
    const { campaignParticipantCompleteTasks = [] } = await v4Client.request(V4_CAMPAIGN_COMPLETED_TASKS, { id })
    return campaignParticipantCompleteTasks
  } catch (error) {
    return undefined
  }
}

const initialState = {
  campaignChapters: undefined,
  isLoading: true,
}

const ChapterTasksContext = createContext(initialState)

function ChapterTasksProvider({ children }) {
  const { account } = useWallet()
  const { data: campaignChapters = [], isLoading: isLoadingChapter } = useSWR(
    ['fetchCampaignChapters', account],
    () => fetchCampaignChapters(),
    {
      refreshInterval: 60000,
    },
  )

  console.log({ campaignChapters })

  const { data: campaignTasks = [], isLoading: isLoadingTask } = useSWR(
    ['fetchCampaignTasks', account],
    () => fetchCampaignTasks(),
    {
      refreshInterval: 60000,
    },
  )

  console.log({ campaignTasks })

  const { data: campaignCompletedTask = [], isLoading: isLoadingCompletedTask } = useSWR(
    ['fetchCampaignCompletedTasks', account],
    () => fetchCampaignCompletedTasks(),
    {
      refreshInterval: 60000,
    },
  )

  const final = useMemo(() => {
    if (!account || isLoadingChapter || isLoadingCompletedTask || isLoadingTask) {
      return initialState
    }

    const campaignChaptersDetails = campaignChapters.map((chapter, chapIndex) => {
      const tasks = campaignTasks
        .filter(task => +task.chapter === chapIndex)
        .map(task => {
          const isCompleted = !!campaignCompletedTask.find(completedTask => completedTask.campaignTask.id === task.id)
          return {
            ...task,
            isCompleted,
          }
        })

      const isCompleted = tasks.every(task => task.isCompleted)
      return {
        ...chapter,
        tasks,
        isCompleted,
      }
    })

    return {
      campaignChapters: campaignChaptersDetails,
      isLoading: isLoadingChapter || isLoadingTask || isLoadingCompletedTask,
    }
  }, [
    account,
    campaignChapters,
    isLoadingChapter,
    campaignTasks,
    isLoadingTask,
    campaignCompletedTask,
    isLoadingCompletedTask,
  ])

  return <ChapterTasksContext.Provider value={final}>{children}</ChapterTasksContext.Provider>
}

const useChapterTasks = () => {
  const { campaignChapters, isLoading } = useContext(ChapterTasksContext)

  return {
    campaignChapters,
    isLoading,
  }
}

export { ChapterTasksContext, ChapterTasksProvider, useChapterTasks }
