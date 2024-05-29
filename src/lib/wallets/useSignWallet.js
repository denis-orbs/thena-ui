import { gql } from 'graphql-request'
import { useCallback } from 'react'
import { useSignMessage } from 'wagmi'

import { errorToast } from '@/lib/notify'

import useWallet from './useWallet'
import { v4Client } from '../graphql'
import { getFromSessionStorage } from '../helper'
import { sleep } from '../utils'

const V4_LOGIN = gql`
  mutation V4_MUTATION_LOGIN($signature: String!, $address: String!) {
    login(
      input: {
        signedMessage: "By signing you agree to 'Terms of Service' & 'Privacy Policy' of THENA"
        signature: $signature
        address: $address
      }
    ) {
      accessToken
    }
  }
`

export const useSignWallet = () => {
  const { account } = useWallet()
  const { signMessage, data: signData } = useSignMessage()

  const deleteToken = useCallback(() => {
    sessionStorage.removeItem('token')
  }, [])

  const login = useCallback(
    async data => {
      try {
        if (!!data && !!account) {
          const {
            login: { accessToken },
          } = await v4Client.request(V4_LOGIN, {
            signature: data,
            address: account,
          })

          if (accessToken) {
            sessionStorage.setItem('token', accessToken)
          }
        }
      } catch (error) {
        sessionStorage.removeItem('token')
      }
    },
    [account],
  )

  const signWallet = useCallback(
    (loginCallback, params, callOnSuccess, callOnReject) => {
      if (account && !signData) {
        signMessage(
          {
            message: "By signing you agree to 'Terms of Service' & 'Privacy Policy' of THENA",
            account,
          },
          {
            onSuccess: async data => {
              await login(data)
              await sleep(3000)
              if (getFromSessionStorage('token')) {
                await loginCallback?.(params)
                callOnSuccess?.()
              }
            },
            onError: () => {
              callOnReject?.()
            },
          },
        )
      }
    },
    [account, login, signMessage, signData],
  )

  return {
    signWallet,
    deleteToken,
  }
}

export async function actionWithAuthentication(action, callOnFailed, params, callOnSuccess, callOnReject) {
  try {
    await action(params)
    callOnSuccess?.()
  } catch (err) {
    if (
      err?.response?.errors?.[0]?.message === 'Missing Authorization Header' ||
      err?.response?.errors?.[0]?.message === 'Invalid Access Token'
    ) {
      callOnFailed(action, params, callOnSuccess, callOnReject)
    } else {
      errorToast('Error')
    }
  }
}
