'use client'

import Loading from '@/app/loading'
import { useTHEStory } from '@/context/THEStoryContext'

import { EditProfile } from './EditProfile'

function EditProfilePage() {
  const { campaignParticipantInfo: userInfo, setCampaignParticipantInfo: updateUserInfo } = useTHEStory()

  if (!userInfo) {
    return <Loading />
  }

  return <EditProfile userInfo={userInfo} updateUserInfo={updateUserInfo} />
}

export default EditProfilePage
