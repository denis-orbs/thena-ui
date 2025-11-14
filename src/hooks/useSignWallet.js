import { gql } from 'graphql-request'
import { useCallback } from 'react'
import { useSignMessage } from 'wagmi'

import { ThenaAuthToken } from '@/constant'
import { ArenaClient } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { errorToast } from '@/lib/notify'
import { sleep } from '@/lib/utils'

import useWallet from './useWallet'

const signedMessage = 'Please sign to confirm the ownership of the wallet.'

const V4_LOGIN = gql`
  mutation V4_MUTATION_LOGIN($signature: String!, $address: String!, $signedMessage: String!) {
    login(input: { signedMessage: $signedMessage, signature: $signature, address: $address }) {
      accessToken
    }
  }
`

export const useSignWallet = () => {
  const { account } = useWallet()
  const { signMessage } = useSignMessage()
  const deleteToken = useCallback(() => {
    localStorage.removeItem(ThenaAuthToken)
  }, [])

  const login = useCallback(async (data, address) => {
    try {
      if (data && address) {
        const {
          login: { accessToken },
        } = await ArenaClient.request(V4_LOGIN, {
          signedMessage,
          signature: data,
          address,
        })

        if (accessToken) {
          localStorage.setItem(ThenaAuthToken, accessToken)
        }
      }
    } catch (error) {
      localStorage.removeItem(ThenaAuthToken)
    }
  }, [])

  const signWallet = useCallback(
    (action, params, callOnSuccess, callOnReject) => {
      if (account) {
        signMessage(
          {
            message: signedMessage,
            account,
          },
          {
            onSuccess: async data => {
              try {
                await login(data, account)
                await sleep(1000)

                if (getFromLocalStorage(ThenaAuthToken)) {
                  if (action) {
                    const res = await action(params)
                    callOnSuccess?.(res)
                  } else {
                    callOnSuccess?.()
                  }
                } else {
                  errorToast('Error')
                  callOnReject?.()
                }
              } catch (err) {
                if (err?.response?.errors?.[0]?.message) {
                  errorToast(err?.response?.errors?.[0]?.message)
                } else {
                  errorToast('Error')
                }
                callOnReject?.()
              }
            },
            onError: () => {
              callOnReject?.()
            },
          },
        )
      }
    },
    [account, login, signMessage],
  )

  return {
    signWallet,
    deleteToken,
  }
}

export async function actionWithAuthentication(action, signFunc, params, callOnSuccess, callOnReject) {
  try {
    const data = await action(params)
    callOnSuccess?.(data)
    return data
  } catch (err) {
    if (
      err?.response?.errors?.[0]?.message === 'Missing Authorization Header' ||
      err?.response?.errors?.[0]?.message === 'Invalid Access Token' ||
      err?.message === 'User not created'
    ) {
      signFunc(action, params, callOnSuccess, callOnReject, true)
    } else {
      if (err?.response?.errors?.[0]?.message) {
        errorToast(err?.response?.errors?.[0]?.message)
      } else {
        errorToast('Error')
      }
      callOnReject?.()
    }
  }
}
