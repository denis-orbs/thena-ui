import { gql } from 'graphql-request'
import { useCallback, useEffect, useState } from 'react'
import { useSignMessage } from 'wagmi'

import useWallet from './useWallet'
import { v4Client } from '../graphql'

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
  const [accessToken, setAccessToken] = useState('')

  const deleteToken = useCallback(() => {
    setAccessToken(undefined)
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
          setAccessToken(token)
          sessionStorage.setItem('token', token)
        }
      }
    } catch (error) {
      setAccessToken(undefined)
      sessionStorage.removeItem('token')
    }
  }, [signData, account])

  const signWallet = useCallback(() => {
    if (account && !accessToken) {
      signMessage({
        message: "By signing you agree to 'Terms of Service' & 'Privacy Policy' of THENA",
        account,
      })
    }
  }, [accessToken, account, signMessage])

  useEffect(() => {
    setAccessToken(sessionStorage.getItem('token'))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => login(), 60000 * 29)

    login()

    return () => clearInterval(interval)
  }, [login])

  return {
    signWallet,
    token: accessToken,
    login,
    deleteToken,
  }
}
