import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'

const V4_GENERATE_URL = gql`
  mutation V4_GENERATE_URL($fileName: String!, $fileType: String!, $userId: String!) {
    generatePresignedUrl(input: { fileName: $fileName, fileType: $fileType, userId: $userId }) {
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

export const useUpload = () => {
  const upload = useCallback(async (file, userId) => {
    const {
      generatePresignedUrl: { signedRequest, url },
    } = await v4Client.request(
      V4_GENERATE_URL,
      {
        fileName: file.name,
        fileType: file.type,
        userId,
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
        await updateCheckMarkIcon(url, userId)
      }
      return true
    }
    throw new Error()
  }, [])

  return { upload }
}
