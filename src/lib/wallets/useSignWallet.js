import { gql } from 'graphql-request'
import { useCallback, useEffect } from 'react'
import { useSignMessage } from 'wagmi'

import useWallet from './useWallet'
import { v4Client } from '../graphql'
import { getFromSessionStorage } from '../helper'

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

  const login = useCallback(async () => {
    try {
      if (!!signData && !!account) {
        const {
          login: { accessToken: token },
        } = await v4Client.request(V4_LOGIN, {
          signature: signData,
          address: account,
        })

        if (token) {
          sessionStorage.setItem('token', token)
        }
      }
    } catch (error) {
      sessionStorage.removeItem('token')
    }
  }, [signData, account])

  const signWallet = useCallback(() => {
    if (account && !signData) {
      signMessage({
        message: "By signing you agree to 'Terms of Service' & 'Privacy Policy' of THENA",
        account,
      })
    }
  }, [account, signData, signMessage])

  useEffect(() => {
    login()
  }, [login])

  return {
    signWallet,
    token: getFromSessionStorage('token'),
    login,
    deleteToken,
  }
}
