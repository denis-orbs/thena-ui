'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import Toggle from '@/components/toggle'
import { Paragraph, TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { v4Client } from '@/lib/graphql'
import { sliceAddress } from '@/lib/utils'
import { Verified } from '@/svgs'

const V4_USERS = gql`
  query V4_USERS($search: String) {
    users(
      limit: 8
      where: { isSuperAdmin_eq: false, isAdmin_eq: false, id_containsInsensitive: $search, isContract_eq: false }
    ) {
      id
      isVerified
      username
    }
  }
`

const fetchUser = async search => {
  try {
    const { users } = await v4Client.request(V4_USERS, { search })
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
        width: 'w-[20%]',
        disabled: true,
      },
      {
        label: 'Wallet ID',
        value: 'walletId',
        width: 'w-[20%]',
        disabled: true,
      },
      {
        label: 'Verification badge',
        value: 'verification',
        width: 'w-[20%]',
        disabled: true,
      },
      {
        value: 'action',
        // width: 'w-[40%]',
      },
    ],
    [],
  )

  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[0])

  const [dataFetch, setDataFetch] = useState([])

  const { isMdDown } = useMediaQuery()
  const t = useTranslations()

  const debounceSearch = useDebounce(searchText, 300)

  const { data } = useSWR(['user api', debounceSearch, reloadFetch], () => fetchUser(debounceSearch))

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setDataFetch(data)
      return
    }
    setDataFetch([])
  }, [data])

  const finalData = useMemo(
    () =>
      dataFetch.map(item => ({
        user: (
          <Link className='flex cursor-pointer items-center gap-2' href={`/arena/profile/${item.id.toLowerCase()}`}>
            <CircleImage src={Avatar} alt='avatar' className='size-9' />
            <TextHeading className='text-base'>{item.username || sliceAddress(item.id)}</TextHeading>
            {item.isVerified && (
              <div className='size-4'>
                <Verified />
              </div>
            )}
          </Link>
        ),
        walletId: (
          <Paragraph className='text-wrap break-words'>{!isMdDown ? sliceAddress(item.id) : item.id}</Paragraph>
        ),
        verification: (
          <Paragraph className='flex flex-row items-center justify-between'>
            {isMdDown ? <TextHeading>Verification badge</TextHeading> : ''}
            <Toggle checked={item.isVerified} onChange={() => {}} />
          </Paragraph>
        ),
        action: (
          <div className='flex w-full flex-col gap-3 md:flex-row md:items-center'>
            <div className='flex w-full flex-row items-center gap-3'>
              <EmphasisButton className='w-full text-base'>{t('Edit checkmark')}</EmphasisButton>
              {userInfo.isSuperAdmin && (
                <EmphasisButton className='w-full text-base' onClick={() => handleClickOpenModal(item, 'add')}>
                  {t('Add admin')}
                </EmphasisButton>
              )}
            </div>
            <div>
              <Link href={`/arena/admin/edit/${item.id}`}>
                <EmphasisButton className='w-full text-base'>{t('Edit profile')}</EmphasisButton>
              </Link>
            </div>
          </div>
        ),
      })),
    [dataFetch, handleClickOpenModal, isMdDown, t, userInfo.isSuperAdmin],
  )

  return (
    <Box>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <TextHeading className='text-xl'>Users</TextHeading>
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
              {item.verification}
              {item.action}
            </div>
          ))}
        </div>
      )}
      {/* <ModalRemoveAddAdmin isOpen={openModal} closeModal={handleCloseModal} type='add' user={addAdmin} /> */}
    </Box>
  )
}

export default Users
