'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import Loading from '@/app/loading'
import { ThenaAuthToken } from '@/constant'
import { useTHEStory } from '@/context/THEStoryContext'
import { useSignWallet } from '@/hooks/useSignWallet'
import { getFromLocalStorage } from '@/lib/helper'

import { EditProfile } from './EditProfile'

function EditProfilePage() {
  const { signWallet } = useSignWallet()
  const router = useRouter()

  const [checkSignWallet, setCheckSignWallet] = useState(Boolean(getFromLocalStorage(ThenaAuthToken)))

  useEffect(() => {
    if (!checkSignWallet) {
      signWallet(
        undefined,
        undefined,
        () => setCheckSignWallet(true),
        () => router.replace('/story/profile'),
      )
    }
  }, [checkSignWallet, router, signWallet])

  const { campaignParticipantInfo: userInfo, setCampaignParticipantInfo: updateUserInfo } = useTHEStory()

  if (!userInfo || !checkSignWallet) {
    return <Loading />
  }

  return (
    <>
      <div className='absolute left-0 top-[129px] h-[960px] w-full bg-[url("/images/edit-profile-bg.png")] bg-cover' />
      <div className='relative'>
        <EditProfile userInfo={userInfo} updateUserInfo={updateUserInfo} />
      </div>
    </>
  )
}

export default EditProfilePage
