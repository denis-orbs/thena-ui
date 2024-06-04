'use client'

import { gql } from 'graphql-request'
import React from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { v4Client } from '@/lib/graphql'
import useWallet from '@/lib/wallets/useWallet'
import { EditProfile } from '@/modules/Profile/EditProfile'

const V4_USER_RANK = gql`
  query V4_UER_RANK($id: String!) {
    tradeRankByAddress(address: $id) {
      rank
    }
  }
`

const V4_USER_INFO = gql`
  query V4_USER($id: String!) {
    userById(id: $id) {
      id
      firstInteractAt
      biography
      timezone
      websiteUrl
      xProfileUrl
      username
      theme
      nameColor
      isVerified
      avatar
      thenianNfts {
        meatadata {
          image
        }
        id
      }
      usernameNfts {
        name
        id
      }
    }
  }
`

const fetchUserInfo = async id => {
  try {
    const { userById } = await v4Client.request(V4_USER_INFO, { id: id.toLowerCase() })

    const { tradeRankByAddress } = await v4Client.request(V4_USER_RANK, { id: id.toLowerCase() })

    return { ...userById, rank: tradeRankByAddress?.[0]?.rank ?? '-' }
  } catch (error) {
    return { error: true }
  }
}

function EditAdminProfile() {
  const { account } = useWallet()

  const {
    data: userInfo,
    isLoading,
    mutate,
  } = useSWR(['edit user info'], () => fetchUserInfo(account?.toLowerCase()), {
    refreshInterval: 60000,
  })

  if (!userInfo || isLoading) {
    return <Loading />
  }

  return <EditProfile userInfo={userInfo} isAdmin mutateUserInfo={mutate} />
}

export default EditAdminProfile
