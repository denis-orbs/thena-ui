'use client'

import { ethers } from 'ethers'
import Link from 'next/link'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import Tag from '@/components/tag'
import { Paragraph, TextHeading } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { sliceAddress } from '@/lib/utils'
import { Verified } from '@/svgs'

function Admins() {
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
  const [sort, setSort] = useState(sortOptions[0])
  const { isMdDown } = useMediaQuery()

  const data = Array(5)
    .fill(1)
    .map(() => ({
      user: ethers.Wallet.createRandom().fingerprint,
      walletId: ethers.Wallet.createRandom().address,
    }))

  const finalData = useMemo(
    () =>
      data.map(item => ({
        user: (
          <Link
            className='flex cursor-pointer items-center gap-2 md:items-start'
            href={`/arena/profile/${item.user.toLowerCase()}`}
          >
            <CircleImage src={Avatar} alt='avatar' className='size-9' />
            <div className='flex gap-2 md:flex-col'>
              <div className='flex flex-row items-center gap-2'>
                <TextHeading className='text-base'>{sliceAddress(item.user)}</TextHeading>
                <div className='size-4'>
                  <Verified />
                </div>
              </div>
              <Tag>admin</Tag>
            </div>
          </Link>
        ),
        walletId: (
          <Paragraph className='text-wrap break-words'>
            {!isMdDown ? sliceAddress(item.walletId) : item.walletId}
          </Paragraph>
        ),
        action: (
          <div className='flex w-full flex-col gap-3 md:flex-row md:items-center'>
            <div className='flex w-full flex-row items-center gap-3'>
              <EmphasisButton className='w-full text-base'>Edit checkmark</EmphasisButton>
              <EmphasisButton className='w-full text-base'>Remove admin</EmphasisButton>
            </div>
            <div>
              <EmphasisButton className='w-full text-base'>Change Avatar</EmphasisButton>
            </div>
          </div>
        ),
      })),
    [data, isMdDown],
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
    </Box>
  )
}

export default Admins
