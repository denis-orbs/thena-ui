import { gql } from 'graphql-request'
import { useMemo } from 'react'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'

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
    const { campaignTasks } = await v4Client.request(V4_CAMPAIGN_TASKS)
    if (campaignTasks && Array.isArray(campaignTasks)) {
      return campaignTasks
    }

    return []
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
  dailySwaps: [],
  campaignChapters: [],
  isLoading: true,
}

const useFetchChaptersAndTasks = id => {
  const { data: campaignChapters = [], isLoading: isLoadingChapter } = useSWR(
    ['fetchCampaignChapters', id],
    () => fetchCampaignChapters(),
    {
      refreshInterval: 60000,
    },
  )

  const { data: campaignTasks = [], isLoading: isLoadingTask } = useSWR(
    ['fetchCampaignTasks', id],
    () => fetchCampaignTasks(),
    {
      refreshInterval: 60000,
    },
  )

  const { data: campaignCompletedTask = [], isLoading: isLoadingCompletedTask } = useSWR(
    ['fetchCampaignCompletedTasks', id],
    () => fetchCampaignCompletedTasks(id),
    {
      refreshInterval: 60000,
    },
  )
  const final = useMemo(() => {
    const currentDate = new Date()
    if (!id || isLoadingChapter || isLoadingCompletedTask || isLoadingTask) {
      return initialState
    }

    // check completed chapters and tasks
    // filter chapter task with type [Main]
    const campaignChaptersDetails = campaignChapters.map((chapter, chapIndex) => {
      const tasks = campaignTasks
        .filter(task => +task.chapter === chapIndex + 1 && task.type === 'Main')
        .map(task => {
          const isCompleted = !!campaignCompletedTask.find(completedTask => completedTask.campaignTask.id === task.id)

          return {
            ...task,
            isCompleted,
          }
        })

      const isCompleted = tasks.every(task => task.isCompleted)

      const startTime = new Date(chapter.startTimestamp)
      const endTime = new Date(chapter.endTimestamp)
      const available = currentDate >= startTime && currentDate <= endTime
      return {
        ...chapter,
        index: chapIndex + 1,
        tasks,
        isCompleted,
        available,
      }
    })

    let currentChapterIndex = campaignChapters.findIndex(chapter => {
      const startTime = new Date(chapter.startTimestamp)
      const endTime = new Date(chapter.endTimestamp)

      return currentDate >= startTime && currentDate <= endTime
    })
    // FIXME remove default chapter index 0
    currentChapterIndex = currentChapterIndex !== -1 ? currentChapterIndex : 0

    let dailySwaps = campaignTasks
      .filter(task => task.chapter === currentChapterIndex + 1 && task.type === 'Daily')
      .map(task => {
        const isCompleted = !!campaignCompletedTask.find(completedTask => completedTask.campaignTask.id === task.id)
        return {
          ...task,
          isCompleted,
        }
      })
      .sort((swap1, swap2) => swap1.index - swap2.index)

    const firstSwapRewardAmount = dailySwaps[0]?.rewardAmount?.[0] ?? 1
    dailySwaps = dailySwaps.map(swap => {
      const ratio = swap.rewardAmount[0] / firstSwapRewardAmount
      return {
        ...swap,
        ratio,
      }
    })

    return {
      dailySwaps,
      campaignChapters: campaignChaptersDetails,
      isLoading: isLoadingChapter || isLoadingTask || isLoadingCompletedTask,
    }
  }, [
    id,
    campaignChapters,
    isLoadingChapter,
    campaignTasks,
    isLoadingTask,
    campaignCompletedTask,
    isLoadingCompletedTask,
  ])

  return final
}

export { fetchCampaignChapters, fetchCampaignCompletedTasks, fetchCampaignTasks, useFetchChaptersAndTasks }
