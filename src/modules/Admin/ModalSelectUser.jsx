import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import { Paragraph } from '@/components/typography'

export function ModalSelectUser({ popup, setPopup, selectedUsers, setSelectedUsers }) {
  const t = useTranslations()

  const [searchText, setSearchText] = useState('')
  const users = []
  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title={t('Select Tokens')}
    >
      <div className='mb-3 px-6 py-3'>
        <SearchInput
          className='w-full'
          val={searchText}
          setVal={setSearchText}
          placeholder='Search by Name, Symbol or Address'
          autoFocus
        />
      </div>
      <div className='h-px w-full border border-neutral-700' />
      <div className='flex flex-col gap-2 p-3'>
        <Paragraph className='mb-3 px-6'>{t('Users')}</Paragraph>
        <div className='flex justify-between px-6'>
          <span className='text-gray-400'>{selectedUsers.length} Selected</span>
          <span
            className='cursor-pointer text-primary-400'
            onClick={() => {
              if (selectedUsers.length > 0) {
                setSelectedUsers([])
              } else {
                setSelectedUsers(users.map(user => user.id))
              }
            }}
          >
            {selectedUsers.length > 0 ? 'Clear All' : 'Select All'}
          </span>
        </div>
        <div className='max-h-[340px] overflow-auto'>
          {users?.map(user => {
            const isSelected = selectedUsers.find(ele => ele === user.id)
            return (
              <div
                className={`flex cursor-pointer items-center justify-between rounded-lg px-6 py-3
                 hover:bg-slate-800 ${isSelected ? 'bg-neutral-800' : ''} gap-5`}
                onClick={() => {
                  let temp = [...selectedUsers]
                  if (isSelected) {
                    temp = selectedUsers.filter(ele => ele !== user.id)
                    setSelectedUsers(temp)
                  } else {
                    temp.push(user.id)
                    setSelectedUsers(temp)
                  }
                }}
                key={user.id}
              >
                <UserProfileCard user={user} disableLink showVerified enableFollow={false} />
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
