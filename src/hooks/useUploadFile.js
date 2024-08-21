import { gql } from 'graphql-request'
import { useCallback } from 'react'
import FileResizer from 'react-image-file-resizer'

import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'

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
      authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
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
      authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
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
}

export const useUploadCheckMarkIcon = () => {
  const { signWallet } = useSignWallet()

  const uploadFn = useCallback(async ({ file, userId }) => {
    if (file) {
      const url = await generateUrlUpload({ file, userId, type: 'CHECK_MARK' })
      if (url) {
        await updateCheckMarkIcon(url, userId)
        return url
      }
    } else {
      await updateCheckMarkIcon(null, userId)
      return null
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

async function resizeFile(file) {
  return new Promise(resolve => {
    FileResizer.imageFileResizer(file, 800, 600, 'WEBP', 100, 0, uri => resolve(uri))
  }).then(res => {
    const arr = res.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[arr.length - 1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], file.name, { type: mime })
  })
}

export const useUploadBanner = () => {
  const { signWallet } = useSignWallet()

  const uploadFn = useCallback(async ({ file, userId, tcId }) => {
    if (file) {
      const resizedFile = await resizeFile(file)

      const url = await generateUrlUpload({ file: resizedFile, userId, type: 'BANNER' })
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
          await updateProfileFn({ ...userData, avatar: url })
          return url
        }
      } else {
        await updateProfileFn({ ...userData, avatar: null })
        return null
      }
      return false
    },
    [updateProfileFn],
  )

  const uploadAvatar = useCallback(
    async (file, userInfo, callOnSuccess) =>
      await actionWithAuthentication(uploadFn, signWallet, { file, userInfo }, callOnSuccess),
    [uploadFn, signWallet],
  )

  return { uploadAvatar }
}
