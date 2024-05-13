import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
import { actionWithAuthentication, useSignWallet } from '@/lib/wallets/useSignWallet'

import { useUpdateProfile } from './useProfile'

const V4_GENERATE_URL = gql`
  mutation V4_GENERATE_URL($fileName: String!, $fileType: String!, $userId: String!, $type: BucketType) {
    generatePresignedUrl(input: { fileName: $fileName, fileType: $fileType, userId: $userId, type: $type }) {
      signedRequest
      url
    }
  }
`

const V4_UPDATE_CHECKMARK = gql`
  mutation V4_UPDATE_CHECKMARK($checkMarkIcon: String, $userId: String!) {
    updateCheckMarkIcon(checkMarkIcon: $checkMarkIcon, userId: $userId) {
      id
      checkMarkIcon
    }
  }
`

const V4_UPDATE_BANNER = gql`
  mutation V4_UPDATE_BANNER($bannerUrl: String, $tcId: String!) {
    updateBanner(bannerUrl: $bannerUrl, tcId: $tcId) {
      id
      bannerUrl
    }
  }
`

export const updateCheckMarkIcon = async (value, userId) => {
  const res = await v4Client.request(
    V4_UPDATE_CHECKMARK,
    { checkMarkIcon: value, userId },
    {
      authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
    },
  )

  if (res?.response?.errors) {
    throw new Error(res?.response?.errors?.[0]?.message)
  }
}

export const updateBanner = async (value, tcId) => {
  const res = await v4Client.request(
    V4_UPDATE_BANNER,
    { bannerUrl: value, tcId },
    {
      authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
    },
  )

  if (res?.response?.errors) {
    throw new Error(res?.response?.errors?.[0]?.message)
  }
}

export const generateUrlUpload = async ({ file, userId, type }) => {
  const {
    generatePresignedUrl: { signedRequest, url },
  } = await v4Client.request(
    V4_GENERATE_URL,
    {
      fileName: file.name,
      fileType: file.type,
      userId,
      type,
    },
    {
      authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
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
}

export const useUploadCheckMarkIcon = () => {
  const { signWallet } = useSignWallet()

  const uploadFn = useCallback(async ({ file, userId }) => {
    if (file) {
      const url = await generateUrlUpload({ file, userId, type: 'CHECK_MARK' })
      if (url) {
        return await updateCheckMarkIcon(url, userId)
      }
    } else {
      return await updateCheckMarkIcon(null, userId)
    }
    return false
  }, [])

  const upload = useCallback(
    async (file, userId, callOnSuccess) => {
      actionWithAuthentication(uploadFn, signWallet, { file, userId }, callOnSuccess)
    },
    [uploadFn, signWallet],
  )

  return { upload }
}

export const useUploadBanner = () => {
  const { signWallet } = useSignWallet()

  const uploadFn = useCallback(async ({ file, userId, tcId }) => {
    if (file) {
      const url = await generateUrlUpload({ file, userId, type: 'BANNER' })
      if (url) {
        return await updateBanner(url, tcId)
      }
    } else {
      return await updateBanner(null, tcId)
    }
    return false
  }, [])

  const uploadBanner = useCallback(
    async (file, userId, tcId, callOnSuccess) => {
      actionWithAuthentication(uploadFn, signWallet, { file, userId, tcId }, callOnSuccess)
    },
    [uploadFn, signWallet],
  )

  return { uploadBanner }
}

export const useUpdateAvatar = (isAdmin, user) => {
  const { signWallet } = useSignWallet()
  const { updateProfileFn } = useUpdateProfile(isAdmin ? user?.id : null)

  const uploadFn = useCallback(
    async ({ file, userInfo }) => {
      const { id, ...userData } = userInfo
      if (file) {
        const url = await generateUrlUpload({ file, userId: id, type: 'CUSTOM_AVATAR' })
        if (url) {
          return await updateProfileFn({ ...userData, avatar: url })
        }
      } else {
        return await updateProfileFn({ ...userData, avatar: null })
      }
      return false
    },
    [updateProfileFn],
  )

  const uploadAvatar = useCallback(
    async (file, userInfo, callOnSuccess) => {
      actionWithAuthentication(uploadFn, signWallet, { file, userInfo }, callOnSuccess)
    },
    [uploadFn, signWallet],
  )

  return { uploadAvatar }
}
