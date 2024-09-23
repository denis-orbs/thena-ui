import { useQuery } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import { useCallback, useMemo } from 'react'

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
      createdAt
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
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(updateParticipantProfileFn, signWallet, params, callOnSuccess, callOnReject),
    [updateParticipantProfileFn, signWallet],
  )

  return { updateParticipantProfile }
}

const V4_GENERATE_AVATAR_PROFILE_URL = gql`
  mutation V4_GENERATE_AVATAR_PROFILE_URL($fileName: String!, $fileType: String!, $userId: String!) {
    generatePresignedUrl(input: { fileName: $fileName, fileType: $fileType, userId: $userId, type: CUSTOM_AVATAR }) {
      signedRequest
      url
    }
  }
`
const V4_UPDATE_PARTICIPANT_AVATAR = gql`
  mutation V4_UPDATE_PARTICIPANT_AVATAR($avatarUrl: String = "") {
    updateParticipantProfile(input: { avatarUrl: $avatarUrl }) {
      avatarUrl
    }
  }
`

export const useUpdateParticipantAvatar = () => {
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
    async (file, userId, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(createPresignUrlFn, signWallet, { file, userId }, callOnSuccess, callOnReject),
    [createPresignUrlFn, signWallet],
  )

  const updateParticipantAvatarFn = useCallback(async avatarUrl => {
    const { updateParticipantProfile } = await v4Client.request(
      V4_UPDATE_PARTICIPANT_AVATAR,
      {
        avatarUrl,
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

  const updateParticipantAvatar = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(updateParticipantAvatarFn, signWallet, params, callOnSuccess, callOnReject),
    [updateParticipantAvatarFn, signWallet],
  )

  return { createPresignUrl, updateParticipantAvatar }
}

const V4_CAMPAIGN_CHAPTER = gql`
  query V4_FIRST_CAMPAIGN_CHAPTER($index: Int) {
    campaignChapters(orderBy: index_ASC, where: { index_eq: $index }) {
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

const V4_GET_STORY_LEADERBOARD = gql`
  query V4_GET_STORY_LEADERBOARD($limit: Int!) {
    campaignParticipants(limit: $limit, orderBy: [totalPoints_DESC, createdAt_ASC]) {
      id
      rank
      referralCode
      avatarUrl
      totalFragments
      totalPoints
    }
  }
`
export const fetchStoryLeaderboard = async limit => {
  try {
    const { campaignParticipants } = await v4Client.request(V4_GET_STORY_LEADERBOARD, {
      limit,
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

const V4_GET_STORY_LEADERBOARD_BY_CHAPTER = gql`
  query V4_GET_STORY_LEADERBOARD_BY_CHAPTER(
    $limit: Int!
    $indexChapter: Int!
    $participantId: String!
    $type: CampaignLeaderboardType!
  ) {
    campaignLeaderboard(chapterIndex: $indexChapter, limit: $limit, participantId: $participantId, type: $type) {
      pagination {
        totalCount
        totalTask
      }
      participantDetails {
        avatarUrl
        completedTask
        participantId
        reward
        username
      }
      results {
        avatarUrl
        completedTask
        participantId
        reward
        username
      }
    }
  }
`

export const fetchLeaderboardByChapter = async (limit, indexChapter, participantId, type) => {
  try {
    const { campaignLeaderboard } = await v4Client.request(V4_GET_STORY_LEADERBOARD_BY_CHAPTER, {
      limit,
      indexChapter,
      participantId,
      type,
    })

    if (campaignLeaderboard) {
      return campaignLeaderboard
    }

    return {}
  } catch (error) {
    console.trace(error)
    return {}
  }
}

const V4_DAILY_SWAPS = gql`
  query V4_DAILY_SWAPS($id: String = "") {
    participantDailySwap(participantId: $id) {
      day
      lastSwap
    }
    campaignTasks(where: { isHidden_eq: false, type_in: [Daily] }, orderBy: [index_ASC]) {
      id
      index
      name
      rewardType
      rewardAmount
    }
  }
`
const fetchDailySwaps = async id => {
  try {
    const res = await v4Client.request(V4_DAILY_SWAPS, { id })

    if (res) {
      return res
    }

    return false
  } catch (error) {
    console.log(error)
    return false
  }
}

const V4_CAMPAIGN_CHAPTERS_TASKS_AND_COMPLETED = gql`
  query V4_CAMPAIGN_CHAPTERS_TASKS_AND_COMPLETED($id: String = "") {
    campaignChapters(orderBy: index_ASC) {
      id
      index
      name
      startTimestamp
      endTimestamp
      rewardsTimestamp
    }
    campaignTasks(where: { isHidden_eq: false, type_in: [Main, Side] }, orderBy: [type_ASC, index_ASC]) {
      actionHandle
      chapter
      id
      index
      name
      rewardType
      rewardAmount
      type
    }
    campaignParticipantCompleteTasks(where: { participant: { id_eq: $id } }) {
      campaignTask {
        id
        chapter
      }
      timestamp
    }
  }
`
const fetchCampaignChaptersTasksAndCompletedTasks = async id => {
  try {
    const {
      campaignParticipantCompleteTasks = [],
      campaignChapters = [],
      campaignTasks = [],
    } = await v4Client.request(V4_CAMPAIGN_CHAPTERS_TASKS_AND_COMPLETED, { id })

    return {
      campaignChapters,
      campaignTasks,
      campaignParticipantCompleteTasks,
    }
  } catch (error) {
    console.log(error)
    return {
      campaignChapters: [],
      campaignTasks: [],
      campaignParticipantCompleteTasks: [],
    }
  }
}

const initialState = {
  userSwaps: {
    day: null,
    lastSwap: null,
  },
  dailySwaps: [],
  campaignChapters: [],
  isLoading: true,
}

export const useFetchChaptersAndTasks = account => {
  const { data, isLoading } = useQuery({
    queryKey: ['fetchCampaignChaptersTasksAndCompletedTasks', account],
    queryFn: () => fetchCampaignChaptersTasksAndCompletedTasks(account?.toLowerCase()),
    refetchInterval: 30000,
    enabled: Boolean(account),
    gcTime: 0,
  })

  const { data: dataSwaps, isLoading: isLoadingSwaps } = useQuery({
    queryKey: ['fetchDailySwaps', account],
    queryFn: () => fetchDailySwaps(account?.toLowerCase()),
    refetchInterval: 30000,
    enabled: Boolean(account),
    gcTime: 0,
  })

  const final = useMemo(() => {
    const currentTime = new Date()
    if (!account || isLoading || !data || isLoadingSwaps || !dataSwaps) {
      return initialState
    }

    const { campaignChapters, campaignTasks, campaignParticipantCompleteTasks: campaignCompletedTasks } = data
    const { campaignTasks: dailySwaps, participantDailySwap: userSwaps } = dataSwaps

    // check completed chapters and tasks
    const campaignChaptersDetails = campaignChapters.map(chapter => {
      const startTime = new Date(chapter?.startTimestamp ?? 0)

      // Assign tasks into chapter
      const tasks = campaignTasks
        .filter(task => (+task.chapter === chapter.index && task.type === TaskType.Main) || task.type === TaskType.Side)
        .map(task => {
          let isCompleted = false

          if (task.type === TaskType.Main) {
            isCompleted = campaignCompletedTasks.find(completedTask => completedTask.campaignTask.id === task.id)
          }

          return {
            ...task,
            isCompleted,
          }
        })

      const chapterIsCompleted = tasks.filter(task => task.type === TaskType.Main).every(task => task.isCompleted)

      const available = currentTime >= startTime
      return {
        ...chapter,
        tasks,
        isCompleted: chapterIsCompleted,
        available,
      }
    })

    return {
      dailySwaps,
      userSwaps,
      campaignChapters: campaignChaptersDetails,
      isLoading,
    }
  }, [account, data, dataSwaps, isLoading, isLoadingSwaps])

  return final
}

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
      createdAt
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
          const err = { response: { errors: [{ message: validator }] } }
          throw err
        } else if (error?.extensions?.exception?.detail) {
          const err = { response: { errors: [{ message: error?.extensions?.exception?.detail }] } }
          throw err
        }
        throw e
      }
      return false
    }
  }, [])

  const registerToTHEStory = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(registerFn, signWallet, params, callOnSuccess, callOnReject),
    [registerFn, signWallet],
  )

  return { registerToTHEStory }
}

const V4_STATS_CAMPAIGN_PARTICIPANT = gql`
  query V4_STATS_CAMPAIGN_PARTICIPANT {
    statsCampaignParticipant {
      activeUserCount
      chapterMetrics {
        activeParticipants
        chapter
        completedParticipants
      }
      registeredReferralCount
      successReferralCount
      userCompletedAllTasksCount
      registeredUserCount
    }
  }
`

export const fetchStatsCampaignParticipant = async () => {
  try {
    const { statsCampaignParticipant } = await v4Client.request(V4_STATS_CAMPAIGN_PARTICIPANT)

    if (statsCampaignParticipant) {
      return statsCampaignParticipant
    }

    return null
  } catch (error) {
    console.trace(error)
    return null
  }
}
