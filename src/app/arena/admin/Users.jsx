'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import Toggle from '@/components/toggle'
import { Paragraph, TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ArenaClient } from '@/lib/graphql'
import { successToast } from '@/lib/notify'
import ModalEditCheckMark from '@/modules/Admin/ModalEditCheckMark'
import { useUpdateUserIsVerified } from '@/modules/Arena/hooks/profile'
import { sliceAddress } from '@/utils/utils'

const V4_USERS = gql`
  query V4_USERS($where: UserWhereInput = {}) {
    users(orderBy: firstInteractAt_DESC, limit: 8, where: $where) {
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
    const querySearch = { OR: [{ id_containsInsensitive: search }, { username_containsInsensitive: search }] }
    const where = { ...querySearch }

    const { users } = await ArenaClient.request(V4_USERS, { where })
    return users
  } catch (error) {
    return { error: true }
  }
}

function Users({ userInfo, reloadFetch = 0, handleClickOpenModal, setReloadFetch }) {
  const sortOptions = useMemo(
    () => [
      {
        label: 'User',
        value: 'user',
        width: userInfo?.isSuperAdmin ? 'w-[20%]' : 'w-[30%]',
        disabled: true,
      },
      {
        label: 'Wallet ID',
        value: 'walletId',
        width: userInfo?.isSuperAdmin ? 'w-[20%]' : 'w-[30%]',
        disabled: true,
      },
      {
        label: 'Verification badge',
        value: 'verification',
        width: userInfo?.isSuperAdmin ? 'w-[20%]' : 'w-[30%]',
        disabled: true,
      },
      {
        value: 'action',
        disabled: true,
        // width: 'w-[40%]',
      },
    ],
    [userInfo?.isSuperAdmin],
  )

  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[0])
  const [refetchUpdated, setRefetchUpdated] = useState(0)
  const [showModalEditCheckMark, setShowModalEditCheckMark] = useState(false)
  const [userEditCheckMark, setUserEditCheckMark] = useState(null)

  const [dataFetch, setDataFetch] = useState([])

  const { isMdDown } = useMediaQuery()
  const t = useTranslations()

  const { updateUserIsVerified } = useUpdateUserIsVerified()

  const debounceSearch = useDebounce(searchText, 300)

  const { data, isLoading } = useSWR(['all user api', debounceSearch, reloadFetch, refetchUpdated], () =>
    fetchUser(debounceSearch),
  )

  const handleUpdateUserIsVerified = useCallback(
    async ({ isVerified, userId }) => {
      await updateUserIsVerified({ isVerified, userId }, () => {
        setRefetchUpdated(refetchUpdated + 1)
        setReloadFetch(reloadFetch + 1)
        successToast('Successfully')
      })
    },
    [refetchUpdated, reloadFetch, setReloadFetch, updateUserIsVerified],
  )

  const handleClickOpenEditCheckMark = useCallback(user => {
    setShowModalEditCheckMark(true)
    setUserEditCheckMark(user)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModalEditCheckMark(false)
    setUserEditCheckMark(null)
  }, [])

  const onUpdateCheckMark = useCallback(
    url =>
      setDataFetch(prev =>
        prev.map(user => {
          if (user.id === userEditCheckMark?.id) {
            user.checkMarkIcon = url
          }
          return user
        }),
      ),
    [userEditCheckMark?.id],
  )

  useEffect(() => {
    if (!isLoading) {
      if (data && Array.isArray(data)) {
        setDataFetch(data)
        return
      }
      setDataFetch([])
    }
  }, [data, isLoading])

  const finalData = useMemo(
    () =>
      dataFetch.map(item => ({
        user: <UserProfileCard user={item} showVerified={item.isVerified} />,
        walletId: (
          <Paragraph className='text-wrap break-words'>{!isMdDown ? sliceAddress(item.id) : item.id}</Paragraph>
        ),
        verification: (
          <Paragraph className='flex flex-row items-center justify-between'>
            {isMdDown ? <TextHeading>{t('Verification badge')}</TextHeading> : ''}
            <Toggle
              checked={item.isVerified}
              onChange={() => handleUpdateUserIsVerified({ isVerified: !item.isVerified, userId: item.id })}
            />
          </Paragraph>
        ),
        action: (
          <div className='flex w-full flex-col gap-3 md:flex-row md:items-center'>
            <div className='flex w-full flex-row items-center gap-3'>
              <EmphasisButton className='w-full text-base' onClick={() => handleClickOpenEditCheckMark(item)}>
                {t('Edit Checkmark')}
              </EmphasisButton>
              {userInfo?.isSuperAdmin && userInfo?.id !== item.id && (
                <EmphasisButton
                  className='w-full text-base'
                  onClick={() => handleClickOpenModal(item, item.isAdmin ? 'remove' : 'add')}
                >
                  {t(item.isAdmin ? 'Remove Admin' : 'Add Admin')}
                </EmphasisButton>
              )}
            </div>
            <div className='w-full'>
              <Link href={`/arena/admin/edit/${item.id}`}>
                <EmphasisButton className='w-full text-base'>{t('Edit Profile')}</EmphasisButton>
              </Link>
            </div>
          </div>
        ),
      })),
    [
      dataFetch,
      handleClickOpenEditCheckMark,
      handleClickOpenModal,
      handleUpdateUserIsVerified,
      isMdDown,
      t,
      userInfo?.id,
      userInfo?.isSuperAdmin,
    ],
  )

  return (
    <Box>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <TextHeading className='text-xl'>{t('Users')}</TextHeading>
        <SearchInput
          className='h-11 w-full md:w-[480px]'
          classNames={{ input: 'h-11' }}
          val={searchText}
          setVal={setSearchText}
          placeholder='Search by name or wallet ID'
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
          loading={isLoading}
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
              {item.verification}
              {item.action}
            </div>
          ))}
        </div>
      )}
      {showModalEditCheckMark && (
        <ModalEditCheckMark
          isOpen={showModalEditCheckMark}
          closeModal={handleCloseModal}
          user={userEditCheckMark}
          onChange={onUpdateCheckMark}
        />
      )}
    </Box>
  )
}

export default Users
