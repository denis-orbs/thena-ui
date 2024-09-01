import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { ThenaAuthToken } from '@/constant'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'

const V4_GENERATE_PRESIGNED_URL = gql`
  mutation V4_GENERATE_PRESIGNED_URL($fileName: String!, $fileType: String!, $userId: String!, $type: BucketType) {
    generatePresignedUrl(input: { fileName: $fileName, fileType: $fileType, userId: $userId, type: $type }) {
      signedRequest
      url
    }
  }
`
export const useCreatePresignedUrl = () => {
  const { signWallet } = useSignWallet()

  const createPresignedUrlFn = useCallback(async ({ file, userId, type }) => {
    const {
      generatePresignedUrl: { signedRequest, url },
    } = await v4Client.request(
      V4_GENERATE_PRESIGNED_URL,
      {
        fileName: file.name,
        fileType: file.type,
        userId,
        type,
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

  const createPresignedUrl = useCallback(
    async (file, userId, type, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(
        createPresignedUrlFn,
        signWallet,
        { file, userId, type },
        callOnSuccess,
        callOnReject,
      ),
    [createPresignedUrlFn, signWallet],
  )

  return { createPresignedUrl }
}
