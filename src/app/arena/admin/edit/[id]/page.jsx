'use client'

import { gql } from 'graphql-request'
import { useParams } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import React, { useEffect } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import useWallet from '@/hooks/useWallet'
import { ArenaClient } from '@/lib/graphql'
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
      websiteUrl
      xProfileUrl
      username
      theme
      nameColor
      checkMarkIcon
      verifiedAt
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
    const { userById } = await ArenaClient.request(V4_USER_INFO, { id: id.toLowerCase() })

    const { tradeRankByAddress } = await ArenaClient.request(V4_USER_RANK, { id: id.toLowerCase() })

    if (userById) {
      return { ...userById, rank: tradeRankByAddress?.[0]?.rank ?? '-' }
    }
  } catch (error) {
    return { error: true }
  }
}

function EditUserProfile() {
  const params = useParams()
  const { account } = useWallet()
  const router = useRouter()

  const {
    data: userInfo,
    isLoading,
    mutate,
  } = useSWR(['edit user info', params?.id], () => fetchUserInfo(encodeURIComponent(params?.id)?.toLowerCase()), {
    refreshInterval: 60000,
  })

  useEffect(() => {
    if (!account) {
      router.replace('/arena')
    }
  }, [account, router])

  return params?.id && !isLoading && userInfo ? (
    <EditProfile userInfo={userInfo} isAdmin mutateUserInfo={mutate} />
  ) : (
    <Loading />
  )
}

export default EditUserProfile
