import { gql } from 'graphql-request'
import { useCallback } from 'react'
import { useSignMessage } from 'wagmi'

import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { errorToast } from '@/lib/notify'
import { sleep } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

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
  const { signMessage } = useSignMessage()
  const deleteToken = useCallback(() => {
    localStorage.removeItem('token')
  }, [])

  const login = useCallback(async (data, address) => {
    try {
      if (data && address) {
        const {
          login: { accessToken },
        } = await v4Client.request(V4_LOGIN, {
          signature: data,
          address,
        })

        if (accessToken) {
          localStorage.setItem('token', accessToken)
        }
      }
    } catch (error) {
      localStorage.removeItem('token')
    }
  }, [])

  const signWallet = useCallback(
    (loginCallback, params, callOnSuccess, callOnReject) => {
      if (account) {
        signMessage(
          {
            message: "By signing you agree to 'Terms of Service' & 'Privacy Policy' of THENA",
            account,
          },
          {
            onSuccess: async data => {
              await login(data, account)
              await sleep(3000)
              if (getFromLocalStorage('token')) {
                const res = await loginCallback?.(params)
                callOnSuccess?.(res)
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

export async function actionWithAuthentication(action, callOnFailed, params, callOnSuccess, callOnReject) {
  try {
    const data = await action(params)
    callOnSuccess?.(data)
  } catch (err) {
    if (
      err?.response?.errors?.[0]?.message === 'Missing Authorization Header' ||
      err?.response?.errors?.[0]?.message === 'Invalid Access Token'
    ) {
      callOnFailed(action, params, callOnSuccess, callOnReject, true)
    } else if (err?.response?.errors?.[0]?.message) {
      errorToast(err?.response?.errors?.[0]?.message)
    } else {
      errorToast('Error')
    }
  }
}
