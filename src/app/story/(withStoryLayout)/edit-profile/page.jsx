'use client'

import { gql } from 'graphql-request'
import { useEffect } from 'react'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'
import useWallet from '@/lib/wallets/useWallet'

import { EditProfile } from './EditProfile'

const V4_CAMPAIGN_PARTICIPANT = gql`
  query campaignParticipants($id: String = "") {
    campaignParticipants(where: { id: $id }) {
      avatar
      country
      email
      xProfileUsername
    }
  }
`

const fetchUserInfo = async id => {
  try {
    const { campaignParticipants } = await v4Client.request(V4_CAMPAIGN_PARTICIPANT, { id })
    console.log({ campaignParticipants })
    if (campaignParticipants.length === 1) {
      const user = campaignParticipants[0]
      return {
        ...user,
      }
    }
  } catch (error) {
    return undefined
  }
}

function EditProfilePage() {
  const { account } = useWallet()
  const {
    data: userInfo = {},
    mutate: mutateUserInfo,
    isLoading,
  } = useSWR(['fetchUserInfo', account], () => fetchUserInfo(account.toLowerCase()))

  useEffect(() => {
    if (!isLoading && (!userInfo || !userInfo?.usernameNfts?.length)) {
      // redirect('/arena/profile')
    }
  }, [isLoading, userInfo, userInfo?.usernameNfts])

  console.log({
    userInfo,
    account,
  })

  if (isLoading || !userInfo) {
    // return <Loading />
  }

  return <EditProfile userInfo={userInfo} mutateUserInfo={mutateUserInfo} />
}

export default EditProfilePage
