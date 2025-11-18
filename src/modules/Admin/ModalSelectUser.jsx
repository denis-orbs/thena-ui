import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Modal from '@/components/modal'
import { Paragraph } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { ArenaClient } from '@/lib/graphql'
import cn from '@/utils/classes'

const V4_USERS = gql`
  query V4_USERS($search: String) {
    users(
      orderBy: firstInteractAt_DESC
      limit: 30
      where: { OR: [{ id_containsInsensitive: $search }, { username_containsInsensitive: $search }] }
    ) {
      id
      isVerified
      username
      nameColor
      avatar
      isAdmin
      isSuperAdmin
      checkMarkIcon
      verifiedAt
    }
  }
`

const fetchUser = async search => {
  try {
    const { users } = await ArenaClient.request(V4_USERS, { search })
    return users
  } catch (error) {
    return []
  }
}

export function ModalSelectUser({ popup, setPopup, selectedUsers, setSelectedUsers }) {
  const t = useTranslations()

  const [searchText, setSearchText] = useState('')

  const debounceSearch = useDebounce(searchText, 300)

  const { data: users, isLoading } = useSWR(['user list', debounceSearch], () => fetchUser(debounceSearch))

  const listUsers = useMemo(() => {
    if (!isLoading && users) {
      return users
    }
  }, [isLoading, users])

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title={t('Select Users')}
    >
      <div className='mb-3 px-6 py-3'>
        <SearchInput
          className='w-full'
          val={searchText}
          setVal={setSearchText}
          placeholder={t('Search by name or address')}
          autoFocus
        />
      </div>
      <div className='h-px w-full border border-neutral-700' />
      <div className='flex flex-col gap-2 p-3'>
        <Paragraph className='mb-3 px-6'>{t('Users')}</Paragraph>
        <div className='flex justify-between px-6'>
          {!!selectedUsers.length && (
            <>
              <span className='text-gray-400'>
                {selectedUsers.length} {t('Selected')}
              </span>
              <span
                className='text-primary-400 cursor-pointer'
                onClick={() => {
                  if (selectedUsers.length > 0) {
                    setSelectedUsers([])
                  }
                }}
              >
                {t('Clear All')}
              </span>
            </>
          )}
        </div>
        <div className='max-h-[340px] overflow-auto'>
          {listUsers?.map(user => {
            const isSelected = selectedUsers.find(ele => ele.id === user.id)
            return (
              <div
                className={cn([
                  'my-1 flex cursor-pointer items-center justify-between rounded-lg px-6 py-3',
                  `hover:bg-slate-800 ${isSelected ? 'bg-neutral-800' : ''} gap-5`,
                ])}
                onClick={() => {
                  let temp = [...selectedUsers]
                  if (isSelected) {
                    temp = selectedUsers.filter(ele => ele.id !== user.id)
                    setSelectedUsers(temp)
                  } else {
                    temp.push(user)
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
