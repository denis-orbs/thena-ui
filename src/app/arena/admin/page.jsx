'use client'

import React, { useCallback, useState } from 'react'

import { useUserInfo } from '@/context/userInfoContext'
import ModalRemoveAddAdmin from '@/modules/Admin/ModalRemoveAddAdmin'

import Admins from './Admins'
import Competitions from './Competitions'
import TopBar from './TopBar'
import Users from './Users'

function AdminPage() {
  const { userInfo } = useUserInfo()
  const [user, setUser] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [type, setType] = useState('')
  const [reloadFetch, setReloadFetch] = useState(0)

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

  return (
    userInfo &&
    userInfo.id &&
    (userInfo.isAdmin || userInfo.isSuperAdmin) && (
      <div className='mt-8 flex flex-col gap-8'>
        <TopBar userInfo={userInfo} />
        <Users userInfo={userInfo} reloadFetch={reloadFetch} handleClickOpenModal={handleClickOpenModal} />
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
  )
}

export default AdminPage
