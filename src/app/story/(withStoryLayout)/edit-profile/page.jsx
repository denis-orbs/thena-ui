'use client'

import Loading from '@/app/loading'
import { useTHEStory } from '@/context/THEStoryContext'

import { EditProfile } from './EditProfile'

function EditProfilePage() {
  const { campaignParticipantInfo: userInfo, setCampaignParticipantInfo: updateUserInfo } = useTHEStory()

  if (!userInfo) {
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
