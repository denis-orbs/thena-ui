import { gql } from 'graphql-request'
import { useCallback } from 'react'
import { useSignMessage } from 'wagmi'

import { ThenaAuthToken } from '@/constant'
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
    localStorage.removeItem(ThenaAuthToken)
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
            message: 'Please sign to confirm the ownership of the wallet.',
            account,
          },
          {
            onSuccess: async data => {
              await login(data, account)
              await sleep(1000)
              if (getFromLocalStorage(ThenaAuthToken)) {
                try {
                  const res = await action(params)
                  callOnSuccess?.(res)
                } catch (err) {
                  if (err?.response?.errors?.[0]?.message) {
                    errorToast(err?.response?.errors?.[0]?.message)
                  } else {
                    errorToast('Error')
                  }
                  callOnReject?.()
                }
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
  } catch (err) {
    if (
      err?.response?.errors?.[0]?.message === 'Missing Authorization Header' ||
      err?.response?.errors?.[0]?.message === 'Invalid Access Token'
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
