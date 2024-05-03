'use client'

import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { v4Client } from '@/lib/graphql'
import { sliceAddress } from '@/lib/utils'
import ModalEditCheckMark from '@/modules/Admin/ModalEditCheckMark'

const V4_ADMINS = gql`
  query V4_ADMINS($search: String) {
    users(
      limit: 8
      where: {
        isSuperAdmin_eq: false
        isAdmin_eq: true
        OR: [{ id_containsInsensitive: $search }, { username_containsInsensitive: $search }]
      }
    ) {
      id
      username
      nameColor
      isVerified
      avatar
      checkMarkIcon
    }
  }
`

const fetchAdmin = async search => {
  try {
    const { users: admins } = await v4Client.request(V4_ADMINS, { search })
    return admins
  } catch (error) {
    return { error: true }
  }
}

function Admins({ userInfo, reloadFetch = 0, handleClickOpenModal }) {
  const sortOptions = useMemo(() => {
    const arr = [
      {
        label: 'User',
        value: 'user',
        width: userInfo.isSuperAdmin ? 'w-[30%]' : 'w-50%',
        disabled: true,
      },
      {
        label: 'Wallet ID',
        value: 'walletId',
        width: userInfo.isSuperAdmin ? 'w-[30%]' : 'w-50%',
        disabled: true,
      },
    ]
    if (userInfo.isSuperAdmin) {
      arr.push({
        value: 'action',
        width: 'w-[50%]',
        disabled: true,
      })
    }

    return arr
  }, [userInfo?.isSuperAdmin])
  const [openEditCheckmark, setOpenEditCheckmark] = useState(false)
  const [selectedUser, setSelectedUser] = useState(undefined)

  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[0])
  const { isMdDown } = useMediaQuery()
  const t = useTranslations()
  const [dataFetch, setDataFetch] = useState([])

  const debounceSearch = useDebounce(searchText, 300)

  const {
    data: admins,
    isLoading,
    mutate,
  } = useSWR(['admin api', debounceSearch, reloadFetch], () => fetchAdmin(debounceSearch))

  useEffect(() => {
    if (!isLoading) {
      if (admins && Array.isArray(admins)) {
        setDataFetch(admins)
        return
      }
      setDataFetch([])
    }
  }, [admins, isLoading])

  const finalData = useMemo(
    () =>
      dataFetch.map(item => ({
        user: (
          <UserProfileCard
            avatar={item.avatar}
            id={item.id}
            nameColor={item.nameColor}
            showVerified={item.isVerified}
            username={item.username}
            verifyImage={item.checkMarkIcon}
            isAdmin
          />
        ),
        walletId: (
          <Paragraph className='text-wrap break-words'>
            {!isMdDown ? (userInfo.isSuperAdmin ? sliceAddress(item.id) : item.id) : item.id}
          </Paragraph>
        ),
        action: userInfo.isSuperAdmin ? (
          <div className='flex w-full flex-col gap-3 md:flex-row md:items-center'>
            <div className='flex w-full flex-row items-center gap-3'>
              <EmphasisButton
                className='w-full text-base'
                onClick={() => {
                  setSelectedUser(item)
                  setOpenEditCheckmark(true)
                }}
              >
                {t('Edit checkmark')}
              </EmphasisButton>
              {userInfo.id !== item.id && (
                <EmphasisButton className='w-full text-base' onClick={() => handleClickOpenModal(item, 'remove')}>
                  {t('Remove Admin')}
                </EmphasisButton>
              )}
            </div>
            <div className='w-full'>
              <EmphasisButton className='w-full text-base'>{t('Edit profile')}</EmphasisButton>
            </div>
          </div>
        ) : null,
      })),
    [dataFetch, handleClickOpenModal, isMdDown, t, userInfo.id, userInfo.isSuperAdmin],
  )

  return (
    <>
      <Box>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <TextHeading className='text-xl'>{t('Admins')}</TextHeading>
          <SearchInput
            className='h-11 w-full md:w-[480px]'
            classNames={{ input: 'h-11' }}
            val={searchText}
            setVal={setSearchText}
            placeholder='Search by name or  wallet ID'
          />
        </div>
        {!isMdDown ? (
          <Table
            sortOptions={sortOptions}
            sort={sort}
            setSort={setSort}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            data={finalData}
            tableBasic
          />
        ) : (
          <div className='flex flex-col'>
            {finalData.map((item, index) => (
              <div
                className={`mt-6 flex flex-col gap-4 ${
                  index !== finalData.length - 1 ? 'border-b border-neutral-700 pb-6' : ''
                }`}
                key={index}
              >
                {item.user}
                {item.walletId}
                {item.action}
              </div>
            ))}
          </div>
        )}
        {/* <ModalRemoveAddAdmin isOpen={openModal} closeModal={handleCloseModal} type='remove' user={adminRemove} /> */}
      </Box>

      {openEditCheckmark && (
        <ModalEditCheckMark
          isOpen={openEditCheckmark}
          closeModal={() => {
            setOpenEditCheckmark(false)
            setSelectedUser(undefined)
          }}
          user={selectedUser}
          mutate={mutate}
        />
      )}
    </>
  )
}

export default Admins
