import { gql } from 'graphql-request'
import { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import { TaskType } from '@/app/story/constant'
import { ThenaAuthToken } from '@/constant'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { errorToast, successToast } from '@/lib/notify'

const V4_CAMPAIGN_PARTICIPANT_BY_ID = gql`
  query V4_CAMPAIGN_PARTICIPANT_BY_ID($id_eq: String = "") {
    campaignParticipants(where: { id_eq: $id_eq }) {
      country
      email
      id
      rank
      rankFirstTwoChapters
      referralCode
      avatarUrl
      totalFragments
      totalPoints
      xProfileUsername
    }
  }
`

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
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
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
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
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
    if (campaignChapters && Array.isArray(campaignChapters) && campaignChapters.length > 0) {
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
const V4_GET_CAMPAIGN_PARTICIPANTS = gql`
  query V4_GET_CAMPAIGN_PARTICIPANTS($limit: Int!) {
    campaignParticipants(limit: $limit, orderBy: [totalPoints_DESC, createdAt_ASC]) {
      country
      email
      id
      rank
      referralCode
      avatarUrl
      totalFragments
      totalPoints
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
    campaignTasks(where: { isHidden_isNull: false }) {
      actionHandle
      chapter
      id
      index
      name
      rewardType
      rewardAmount
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

export const fetchParticipants = async (limit, id_not_eq) => {
  try {
    const { campaignParticipants } = await v4Client.request(V4_GET_CAMPAIGN_PARTICIPANTS, {
      limit,
      id_not_eq,
    })

    if (campaignParticipants && Array.isArray(campaignParticipants) && campaignParticipants.length > 0) {
      return campaignParticipants
    }

    return []
  } catch (error) {
    console.trace(error)
    return []
  }
}

const V4_CAMPAIGN_COMPLETED_TASKS = gql`
  query MyQuery($id: String = "") {
    campaignParticipantCompleteTasks(where: { participant: { id_eq: $id } }) {
      campaignTask {
        id
        chapter
      }
      timestamp
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
      refreshInterval: 30000,
    },
  )

  const { data: campaignTasks = [], isLoading: isLoadingTask } = useSWR(
    ['fetchCampaignTasks', id],
    () => fetchCampaignTasks(),
    {
      refreshInterval: 30000,
    },
  )

  const { data: campaignCompletedTasks = [], isLoading: isLoadingCompletedTask } = useSWR(
    ['fetchCampaignCompletedTasks', id],
    () => fetchCampaignCompletedTasks(id),
    {
      refreshInterval: 30000,
    },
  )
  const final = useMemo(() => {
    const currentDate = new Date()
    if (!id || isLoadingChapter || isLoadingCompletedTask || isLoadingTask) {
      return initialState
    }

    // check completed chapters and tasks
    // filter chapter task with type [Main], [Side]
    const campaignChaptersDetails = campaignChapters.map(chapter => {
      const startTime = new Date(chapter?.startTimestamp ?? 0)
      const endTime = new Date(chapter?.endTimestamp ?? 0)

      const currentChapterCompletedTasks = campaignCompletedTasks.filter(completedTask => {
        const completedTime = new Date(completedTask.timestamp)
        return completedTime >= startTime && completedTime <= endTime
      })

      const tasks = campaignTasks
        .filter(task => (+task.chapter === chapter.index && task.type === TaskType.Main) || task.type === TaskType.Side)
        .map(task => {
          let isCompleted = false

          if (task.type === TaskType.Main) {
            isCompleted = !!currentChapterCompletedTasks.find(
              completedTask => completedTask.campaignTask.id === task.id,
            )
          }

          return {
            ...task,
            isCompleted,
          }
        })
        .sort((task1, task2) => {
          const orderType = [TaskType.Main, TaskType.Side]

          const t1Type = task1.type
          const t2Type = task2.type
          if (orderType.indexOf(t1Type) > orderType.indexOf(t2Type)) return 1
          if (orderType.indexOf(t1Type) < orderType.indexOf(t2Type)) return -1

          const t1TIndex = task1.index
          const t2Index = task2.index
          if (t1TIndex > t2Index) return 1
          if (t1TIndex < t2Index) return -1
          return 0
        })

      const isCompleted = tasks.every(task => task.isCompleted)

      const available = currentDate >= startTime
      return {
        ...chapter,
        index: chapter.index,
        tasks,
        isCompleted,
        available,
      }
    })

    const currentChapter = campaignChapters?.findLast(chapter => chapter.available)

    let dailySwaps = campaignTasks
      .filter(task => task.type === TaskType.Daily)
      .map(task => {
        const startTime = new Date(currentChapter?.startTimestamp ?? 0)
        const endTime = new Date(currentChapter?.endTimestamp ?? 0)

        const isCompleted = !!campaignCompletedTasks.find(completedTask => {
          const completedTime = new Date(completedTask.timestamp)
          return completedTask.campaignTask.id === task.id && completedTime > startTime && completedTime < endTime
        })
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
    campaignCompletedTasks,
    isLoadingCompletedTask,
  ])

  return final
}

export { fetchCampaignChapters, fetchCampaignCompletedTasks, fetchCampaignTasks, useFetchChaptersAndTasks }

const V4_GET_CAMPAIGN_PARTICIPANT_BY_ID = gql`
  query V4_GET_CAMPAIGN_PARTICIPANT_BY_ID($id_eq: String!) {
    campaignParticipants(where: { id_eq: $id_eq }) {
      country
      email
      id
      rank
      referralCode
      avatarUrl
      totalFragments
      totalPoints
    }
  }
`
export const fetchParticipantById = async id_eq => {
  try {
    const { campaignParticipants } = await v4Client.request(V4_GET_CAMPAIGN_PARTICIPANT_BY_ID, {
      id_eq,
    })

    if (campaignParticipants && Array.isArray(campaignParticipants) && campaignParticipants.length > 0) {
      return campaignParticipants[0]
    }

    return null
  } catch (error) {
    console.trace(error)
    return null
  }
}

const V4_REGISTER_CAMPAIGN = gql`
  mutation V4_REGISTER_CAMPAIGN($evmAddress: String!, $email: String!, $country: String!, $referralCode: String = "") {
    registerCampaign(
      input: { evmAddress: $evmAddress, email: $email, country: $country, referralCode: $referralCode }
    ) {
      country
      email
      id
      rank
      rankFirstTwoChapters
      referralCode
      avatarUrl
      totalFragments
      totalPoints
      xProfileUsername
    }
  }
`
export const useRegisterToTHEStory = () => {
  const { signWallet } = useSignWallet()

  const registerFn = useCallback(async ({ evmAddress, email, country, referralCode = '' }) => {
    try {
      const { registerCampaign } = await v4Client.request(
        V4_REGISTER_CAMPAIGN,
        {
          evmAddress,
          email,
          country,
          referralCode,
        },
        {
          authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
        },
      )

      if (registerCampaign) {
        successToast('Successfully')
        return registerCampaign
      }

      errorToast('Error')
      return false
    } catch (e) {
      if (e?.response && e?.response?.errors && e?.response?.errors.length > 0) {
        const error = e?.response?.errors[0]
        if (
          error?.extensions?.exception?.validationErrors &&
          error?.extensions?.exception?.validationErrors.length > 0
        ) {
          const validator = error?.extensions?.exception?.validationErrors[0]
          errorToast(validator?.constraints?.isEmail)
        } else if (error?.extensions?.exception?.detail) {
          errorToast(error?.extensions?.exception?.detail)
        } else {
          errorToast(error?.message)
        }
      }
      return false
    }
  }, [])

  const registerToTHEStory = useCallback(
    (params, callOnSuccess) => actionWithAuthentication(registerFn, signWallet, params, callOnSuccess),
    [registerFn, signWallet],
  )

  return { registerToTHEStory }
}
