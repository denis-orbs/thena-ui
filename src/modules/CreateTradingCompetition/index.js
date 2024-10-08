import { gql } from 'graphql-request'
import { useCallback } from 'react'

import { ThenaAuthToken } from '@/constant'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { errorToast, successToast } from '@/lib/notify'

export const V4_CREATE_TC_TAG = gql`
  mutation V4_CREATE_TC_TAG($name: String!, $description: String) {
    createTCTag(input: { name: $name, description: $description }) {
      id
      name
      description
      ownerId
    }
  }
`

const handleError = e => {
  if (e?.response && e?.response?.errors && e?.response?.errors.length > 0) {
    const error = e?.response?.errors[0]
    if (error?.extensions?.exception?.validationErrors && error?.extensions?.exception?.validationErrors.length > 0) {
      const validator = error?.extensions?.exception?.validationErrors[0]
      const err = { response: { errors: [{ message: validator }] } }
      throw err
    } else if (error?.extensions?.exception?.detail) {
      const err = { response: { errors: [{ message: error?.extensions?.exception?.detail }] } }
      throw err
    }
    throw e
  }
}

export const V4_UPDATE_TC_TAG = gql`
  mutation V4_UPDATE_TC_TAG($name: String!, $description: String, $tcTagId: String!) {
    updateTCTag(input: { name: $name, description: $description }, tcTagId: $tcTagId) {
      id
      name
      description
      ownerId
    }
  }
`
export const V4_DELETE_TC_TAG = gql`
  mutation V4_DELETE_TC_TAG($tcTagId: String!) {
    deleteTCTag(tcTagId: $tcTagId)
  }
`

export const V4_GET_TC_TAG = gql`
  query V4_GET_TC_TAG {
    tcTags {
      id
      name
      description
      type
    }
  }
`

export const V4_ASSIGN_TC_TAG = gql`
  mutation V4_ASSIGN_TC_TAG($tradingCompetitionId: String!, $tcTagId: String!) {
    assignTCTag(input: { tradingCompetitionId: $tradingCompetitionId, tcTagId: $tcTagId }) {
      id
      tcTagId
      tradingCompetitionId
    }
  }
`

export const fetchGetTCTag = async () => {
  try {
    const { tcTags } = await v4Client.request(V4_GET_TC_TAG)

    if (tcTags && Array.isArray(tcTags) && tcTags.length > 0) {
      return tcTags
    }

    return []
  } catch (error) {
    console.trace(error)
    return []
  }
}

export const useCreateTcTag = () => {
  const { signWallet } = useSignWallet()

  const assignTCTagFn = useCallback(async ({ tradingCompetitionId, tcTagId }) => {
    const { assignTCTag } = await v4Client.request(
      V4_ASSIGN_TC_TAG,
      {
        tradingCompetitionId,
        tcTagId,
      },
      {
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
      },
    )

    if (assignTCTag) {
      successToast('Successfully')
      return assignTCTag
    }
  }, [])

  const assignTCTag = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(assignTCTagFn, signWallet, params, callOnSuccess, callOnReject),
    [assignTCTagFn, signWallet],
  )

  const createTcTagFn = useCallback(async ({ name, description }) => {
    try {
      const { createTCTag } = await v4Client.request(
        V4_CREATE_TC_TAG,
        {
          name,
          description,
        },
        {
          authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
        },
      )

      if (createTCTag) {
        successToast('Successfully')
        return createTCTag
      }

      errorToast('Error')
      return false
    } catch (e) {
      handleError(e)
      return false
    }
  }, [])

  const createTCTag = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(createTcTagFn, signWallet, params, callOnSuccess, callOnReject),
    [createTcTagFn, signWallet],
  )

  const updateTCTagFn = useCallback(async ({ name, description, id }) => {
    const { updateTCTag } = await v4Client.request(
      V4_UPDATE_TC_TAG,
      {
        name,
        description,
        tcTagId: id,
      },
      {
        authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
      },
    )

    if (updateTCTag) {
      successToast('Successfully')
      return updateTCTag
    }

    errorToast('Error')
    return false
  }, [])

  const updateTCTag = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(updateTCTagFn, signWallet, params, callOnSuccess, callOnReject),
    [signWallet, updateTCTagFn],
  )

  const deleteTCTagFn = useCallback(async tcTagId => {
    try {
      await v4Client.request(
        V4_DELETE_TC_TAG,
        { tcTagId },
        {
          authorization: getFromLocalStorage(ThenaAuthToken) ? `Bearer ${getFromLocalStorage(ThenaAuthToken)}` : '',
        },
      )
      successToast('Successfully')
      return false
    } catch (e) {
      handleError(e)
      return false
    }
  }, [])

  const deleteTCTag = useCallback(
    async (params, callOnSuccess, callOnReject) =>
      await actionWithAuthentication(deleteTCTagFn, signWallet, params, callOnSuccess, callOnReject),
    [deleteTCTagFn, signWallet],
  )

  return { createTCTag, updateTCTag, deleteTCTag, assignTCTag }
}
