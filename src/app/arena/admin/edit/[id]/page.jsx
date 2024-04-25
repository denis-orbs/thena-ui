'use client'

import { gql } from 'graphql-request'
import { useParams } from 'next/navigation'
import React from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { v4Client } from '@/lib/graphql'
import { getFromSessionStorage } from '@/lib/helper'
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
    const { userById } = await v4Client.request(
      V4_USER_INFO,
      { id: id.toLowerCase() },
      {
        authorization: getFromSessionStorage('token') ? `Bearer ${getFromSessionStorage('token')}` : '',
      },
    )

    const { tradeRankByAddress } = await v4Client.request(V4_USER_RANK, { id: id.toLowerCase() })

    return { ...userById, rank: tradeRankByAddress?.[0]?.rank ?? '-' }
  } catch (error) {
    return { error: true }
  }
}

function EditUserProfile() {
  const params = useParams()

  const { data: userInfo, isLoading } = useSWR(['edit user info'], () => fetchUserInfo(params?.id?.toLowerCase()), {
    refreshInterval: 60000,
  })

  return params?.id && !isLoading ? <EditProfile userInfo={userInfo} isAdmin /> : <Loading />
}

export default EditUserProfile
