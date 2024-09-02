'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import SearchInput from '@/components/input/SearchInput'
import Skeleton from '@/components/skeleton'
import { TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'

function UserThenaIds({ thenaIds }) {
  const t = useTranslations()
  const [searchText, setSearchText] = useState('')

  const debounceSearch = useDebounce(searchText, 300)

  const filterThenaIds = useMemo(
    () =>
      !debounceSearch.trim().length
        ? thenaIds
        : thenaIds.filter(item => item.name?.toLowerCase().includes(debounceSearch.toLowerCase())),
    [debounceSearch, thenaIds],
  )

  return (
    <div>
      <div className='space-y-4'>
        <div className='flex flex-col items-start justify-between lg:flex-row lg:items-center'>
          <TextHeading className='flex-2 text-xl'>
            {t('THENA IDs')} ({thenaIds.length})
          </TextHeading>
          <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
        </div>
        <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
          {filterThenaIds &&
            filterThenaIds.map((item, index) => (
              <Link key={index} href={`/arena/thena-id/browse/${encodeURIComponent(item.name)}`}>
                <Box>{item.name}</Box>
              </Link>
            ))}
          {!filterThenaIds && new Array(4).fill(0).map(() => <Skeleton className='h-[279px] w-full' />)}
        </div>
      </div>
    </div>
  )
}

export default UserThenaIds
