import { gql } from 'graphql-request'
import { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { successToast } from '@/lib/notify'

const V4_CAMPAIGN_PARTICIPANT_BY_ID = gql`
  query V4_CAMPAIGN_PARTICIPANT_BY_ID($id_eq: String = "") {
    campaignParticipants(where: { id_eq: $id_eq }) {
      country
      email
      id
      rank
      referralCode
      avatarUrl
      totalFragments
      totalPoints
      xProfileUsername
    }
  }
`

// const V4_CAMPAIGN_PARTICIPANT_LIST = gql`
//   query V4_CAMPAIGN_PARTICIPANT_LIST (
//     $limit: Int = 10,
//     $orderBy: String = 'rank_ASC',
//     $offset: Int = 1,
//     $id_not_contains: String
//     ) {
//       campaignParticipants(
//         limit: $limit,
//         orderBy: $orderBy,
//         offset: $offset,
//         where: {id_not_contains:  $id_not_contains}
//         ) {
//           id
//           email
//           rank
//         }
//     }
// `

export const fetchTHEStoryParticipant = async user => {
  const { campaignParticipants } = await v4Client.request(V4_CAMPAIGN_PARTICIPANT_BY_ID, {
    id_eq: String(user).toLowerCase(),
  })
  if (campaignParticipants && Array.isArray(campaignParticipants) && campaignParticipants.length) {
    return campaignParticipants[0]
  }
  return null
}

const V4_CAMPAIGN_PARTICIPANT_REFERRALS = gql`
  query V4_CAMPAIGN_PARTICIPANT_REFERRALS($id_eq: String = "") {
    campaignParticipantReferrals(where: { user: { id_eq: $id_eq } }) {
      id
      invitedWallet
      isSuccess
    }
  }
`

export const fetchTHEStoryParticipantReferrals = async user => {
  try {
    const { campaignParticipantReferrals } = await v4Client.request(V4_CAMPAIGN_PARTICIPANT_REFERRALS, {
      id_eq: String(user).toLowerCase(),
    })

    if (campaignParticipantReferrals && Array.isArray(campaignParticipantReferrals)) {
      return campaignParticipantReferrals
    }
    return []
  } catch (error) {
    console.log(error)
    // errorToast(error.errors)
  }
}

export const V4_UPDATE_PARTICIPANT_PROFILE = gql`
  mutation V4_UPDATE_PARTICIPANT_PROFILE(
    $avatarUrl: String = ""
    $country: String = ""
    $email: String = ""
    $xProfileUsername: String = ""
  ) {
    updateParticipantProfile(
      input: { avatarUrl: $avatarUrl, country: $country, email: $email, xProfileUsername: $xProfileUsername }
    ) {
      avatarUrl
      country
      email
      referralCode
      referralText
      xProfileUsername
    }
  }
`

export const useUpdateParticipantProfile = () => {
  const { signWallet } = useSignWallet()

  const updateParticipantProfileFn = useCallback(async ({ avatarUrl, country, email, xProfileUsername }) => {
    const { updateParticipantProfile } = await v4Client.request(
      V4_UPDATE_PARTICIPANT_PROFILE,
      {
        avatarUrl,
        country,
        email,
        xProfileUsername,
      },
      {
        authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
      },
    )

    if (updateParticipantProfile) {
      successToast('Successfully')

      return updateParticipantProfile
    }
    return false
  }, [])

  const updateParticipantProfile = useCallback(
    (params, callOnSuccess) => actionWithAuthentication(updateParticipantProfileFn, signWallet, params, callOnSuccess),
    [updateParticipantProfileFn, signWallet],
  )

  return { updateParticipantProfile, updateParticipantProfileFn }
}

export const V4_GENERATE_AVATAR_PROFILE_URL = gql`
  mutation V4_GENERATE_AVATAR_PROFILE_URL($fileName: String!, $fileType: String!, $userId: String!) {
    generatePresignedUrl(input: { fileName: $fileName, fileType: $fileType, userId: $userId, type: CUSTOM_AVATAR }) {
      signedRequest
      url
    }
  }
`

export const useCreateParticipantAvatarUploadUrl = () => {
  const { signWallet } = useSignWallet()
  const createPresignUrlFn = useCallback(async ({ file, userId }) => {
    const {
      generatePresignedUrl: { signedRequest, url },
    } = await v4Client.request(
      V4_GENERATE_AVATAR_PROFILE_URL,
      {
        fileName: file.name,
        fileType: file.type,
        userId,
      },
      {
        authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
      },
    )

    if (signedRequest && url) {
      const { status, statusText } = await fetch(signedRequest, {
        method: 'PUT',
        body: file,
        redirect: 'follow',
        headers: {
          'Content-Type': file.type,
        },
      })
      if (status !== 200) {
        throw new Error(statusText)
      } else {
        return url
      }
    }
    return null
  }, [])

  const createPresignUrl = useCallback(
    (file, userId, callOnSuccess) =>
      actionWithAuthentication(createPresignUrlFn, signWallet, { file, userId }, callOnSuccess),
    [createPresignUrlFn, signWallet],
  )

  return { createPresignUrlFn, createPresignUrl }
}

const V4_CAMPAIGN_CHAPTER = gql`
  query V4_FIRST_CAMPAIGN_CHAPTER($index: Int) {
    campaignChapters(where: { index_eq: $index }) {
      id
      name
      startTimestamp
      endTimestamp
    }
  }
`

export const fetchCampaignChapter = async index => {
  try {
    const { campaignChapters } = await v4Client.request(V4_CAMPAIGN_CHAPTER, {
      index,
    })
    if (campaignChapters && Array.isArray(campaignChapters)) {
      return campaignChapters[0]
    }

    return null
  } catch (error) {
    console.log(error)
  }
}

const V4_CAMPAIGN_CHAPTERS = gql`
  query V4_CAMPAIGN_CHAPTERS {
    campaignChapters(orderBy: index_ASC) {
      id
      index
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
  console.log({ campaignTasks })

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
    const campaignChaptersDetails = campaignChapters.map(chapter => {
      const tasks = campaignTasks
        .filter(task => +task.chapter === chapter.index && task.type === 'Main')
        .map(task => {
          const isCompleted = !!campaignCompletedTask.find(completedTask => completedTask.campaignTask.id === task.id)

          return {
            ...task,
            isCompleted,
          }
        })

      const isCompleted = tasks.every(task => task.isCompleted)

      const startTime = new Date(chapter.startTimestamp)
      const available = currentDate >= startTime
      return {
        ...chapter,
        index: chapter.index,
        tasks,
        isCompleted,
        available,
      }
    })

    let dailySwaps = campaignTasks
      .filter(task => task.type === 'Daily')
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
