'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

import Loading from '@/app/loading'
import { useUserInfo } from '@/context/userInfoContext'
import { EditProfile } from '@/modules/Profile/EditProfile'

function EditProfilePage() {
  const { userInfo, isLoading, mutateUserInfo } = useUserInfo()

  useEffect(() => {
    if (!isLoading && (!userInfo || !userInfo?.usernameNfts?.length)) {
      redirect('/arena/profile')
    }
  }, [isLoading, userInfo, userInfo?.usernameNfts])

  if (isLoading || !userInfo) {
    return <Loading />
  }

  return (
    <EditProfile
      userInfo={userInfo}
      mutateUserInfo={mutateUserInfo}
      isAdmin={userInfo?.isAdmin || userInfo?.isSuperAdmin}
    />
  )
}

export default EditProfilePage
