import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { ThenaAuthToken } from '@/constant'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { ArenaClient } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'

const V4_GENERATE_PRESIGNED_URL = gql`
  mutation V4_GENERATE_PRESIGNED_URL($fileName: String!, $fileType: String!, $userId: String!, $type: BucketType) {
    generatePresignedUrl(input: { fileName: $fileName, fileType: $fileType, userId: $userId, type: $type }) {
      signedUrl
      fields
      url
    }
  }
`
export const useCreatePresignedUrl = () => {
  const { signWallet } = useSignWallet()

  const createPresignedUrlFn = useCallback(async ({ file, userId, type }) => {
    const {
      generatePresignedUrl: { signedUrl, fields, url },
    } = await ArenaClient.request(
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

    const formData = new FormData()
    Object.entries(JSON.parse(fields)).forEach(([key, value]) => {
      formData.append(key, value)
    })

    formData.append('file', file)

    // const s3Response = await axios.post(signedUrl, formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // })

    if (signedUrl && url) {
      const { status, statusText } = await fetch(signedUrl, {
        method: 'POST',
        body: formData,
        redirect: 'follow',
      })
      if (status !== 204) {
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
