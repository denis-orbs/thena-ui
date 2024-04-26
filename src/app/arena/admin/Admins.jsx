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
import Tag from '@/components/tag'
import { Paragraph, TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { v4Client } from '@/lib/graphql'
import { sliceAddress } from '@/lib/utils'
import { Verified } from '@/svgs'

const V4_ADMINS = gql`
  query V4_ADMINS($search: String) {
    users(limit: 8, where: { isSuperAdmin_eq: false, isAdmin_eq: true, id_containsInsensitive: $search }) {
      id
      username
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
  const sortOptions = useMemo(
    () => [
      {
        label: 'User',
        value: 'user',
        width: 'w-[30%]',
        disabled: true,
      },
      {
        label: 'Wallet ID',
        value: 'walletId',
        width: 'w-[30%]',
        disabled: true,
      },
      {
        value: 'action',
        width: 'w-[50%]',
        disabled: true,
      },
    ],
    [],
  )

  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[2])
  const { isMdDown } = useMediaQuery()
  const t = useTranslations()
  const [dataFetch, setDataFetch] = useState([])

  const debounceSearch = useDebounce(searchText, 300)

  const { data: admins, isLoading } = useSWR(['admin api', debounceSearch, reloadFetch], () =>
    fetchAdmin(debounceSearch),
  )

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
          <Link
            className='flex cursor-pointer items-center gap-2 md:items-start'
            href={`/arena/profile/${item.id.toLowerCase()}`}
          >
            <CircleImage src={Avatar} alt='avatar' className='size-9' />
            <div className='flex gap-2 md:flex-col'>
              <div className='flex flex-row items-center gap-2'>
                <TextHeading className='text-base'>{item.username || sliceAddress(item.id)}</TextHeading>
                {item.isVerified && (
                  <div className='size-4'>
                    <Verified />
                  </div>
                )}
              </div>
              <Tag>admin</Tag>
            </div>
          </Link>
        ),
        walletId: (
          <Paragraph className='text-wrap break-words'>{!isMdDown ? sliceAddress(item.id) : item.id}</Paragraph>
        ),
        action: (
          <div className='flex w-full flex-col gap-3 md:flex-row md:items-center'>
            <div className='flex w-full flex-row items-center gap-3'>
              <EmphasisButton className='w-full text-base'>{t('Edit checkmark')}</EmphasisButton>
              {userInfo.isSuperAdmin && (
                <EmphasisButton className='w-full text-base' onClick={() => handleClickOpenModal(item, 'remove')}>
                  {t('Remove admin')}
                </EmphasisButton>
              )}
            </div>
            <div>
              <EmphasisButton className='w-full text-base'>{t('Edit profile')}</EmphasisButton>
            </div>
          </div>
        ),
      })),
    [dataFetch, handleClickOpenModal, isMdDown, t, userInfo.isSuperAdmin],
  )

  return (
    <Box>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <TextHeading className='text-xl'>Admins</TextHeading>
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
  )
}

export default Admins
