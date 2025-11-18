'use client'

import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useEffect, useState } from 'react'

import { useUserInfo } from '@/app/arena/UserInfoContext'
import useWallet from '@/hooks/useWallet'
import ModalRemoveAddAdmin from '@/modules/Admin/ModalRemoveAddAdmin'

import Admins from './Admins'
import Competitions from './Competitions'
import TopBar from './TopBar'
import Users from './Users'
import VerifiedUser from './VerifiedUser'

function AdminPage() {
  const router = useRouter()
  const { userInfo, isLoading } = useUserInfo()
  const [user, setUser] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [type, setType] = useState('')
  const [reloadFetch, setReloadFetch] = useState(0)
  const { account } = useWallet()

  const handleClickOpenModal = useCallback((userUpdate, typeUpdate = 'remove') => {
    setUser(userUpdate)
    setOpenModal(true)
    setType(typeUpdate)
  }, [])

  const handleCloseModal = () => {
    setOpenModal(false)
    setUser(null)
    setType('')
  }

  useEffect(() => {
    if ((!isLoading && !account) || (userInfo && !(userInfo.isAdmin || userInfo.isSuperAdmin))) {
      router.replace('/arena')
    }
  }, [account, isLoading, router, userInfo])

  return (
    <div className='flex flex-col gap-8'>
      <TopBar userInfo={userInfo} isLoading={isLoading} />
      <VerifiedUser
        userInfo={userInfo}
        reloadFetch={reloadFetch}
        handleClickOpenModal={handleClickOpenModal}
        setReloadFetch={setReloadFetch}
      />
      <Users
        userInfo={userInfo}
        reloadFetch={reloadFetch}
        handleClickOpenModal={handleClickOpenModal}
        setReloadFetch={setReloadFetch}
      />
      <Admins userInfo={userInfo} reloadFetch={reloadFetch} handleClickOpenModal={handleClickOpenModal} />
      <Competitions />
      <ModalRemoveAddAdmin
        isOpen={openModal}
        closeModal={handleCloseModal}
        type={type}
        user={user}
        setReloadFetch={setReloadFetch}
      />
    </div>
  )
}

export default AdminPage
