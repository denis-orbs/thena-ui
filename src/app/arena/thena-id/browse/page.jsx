'use client'

import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import useSWR, { mutate } from 'swr'

import Box from '@/components/box'
import ImageThenaId from '@/components/image/ImageThenaId'
import SearchInput from '@/components/input/SearchInput'
import Skeleton from '@/components/skeleton'
import Toggle from '@/components/toggle'
import { TextHeading } from '@/components/typography'
import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'

const V4_USERNAME_NFTS = gql`
  query V4_USERNAME_NFTS($offset: Int = 0, $where: UsernameNftWhereInput = {}) {
    usernameNfts(orderBy: id_DESC, offset: $offset, limit: 24, where: $where) {
      id
      index
      name
      timestamp
      cost
      owner {
        id
        firstInteractAt
        biography
        timezone
        websiteUrl
        xProfileUrl
        username
        theme
        nameColor
        avatar
        balance
        isSuperAdmin
        checkMarkIcon
        verifiedAt
        isAdmin
        isVerified
      }
    }
  }
`

const fetchUsernameNfts = async (offset = 0, debounceSearch = '') => {
  try {
    let where = {}
    if (debounceSearch) {
      where = {
        name_containsInsensitive: debounceSearch,
      }
    }
    const { usernameNfts } = await v4Client.request(V4_USERNAME_NFTS, {
      offset,
      where,
    })
    return usernameNfts
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

// const V4_AVAILABLE = gql`
//   query V4_AVAILABLE($offset: Int = 0, $where: ThenaIdAvailableWhereInput = {}) {
//     thenaIdAvailables(offset: $offset, orderBy: name_DESC, limit: 24, where: $where) {
//       id
//       cost
//       name
//       trait
//     }
//   }
// `

// const fetchAvailableData = async (offset = 0, debounceSearch = '') => {
//   try {
//     let where = {}
//     if (debounceSearch) {
//       where = {
//         name_containsInsensitive: debounceSearch,
//       }
//     }
//     const { thenaIdAvailables } = await v4Client.request(V4_AVAILABLE, {
//       offset,
//       where,
//     })

//     return thenaIdAvailables
//   } catch (error) {
//     console.log(error)
//     return { error: true }
//   }
// }

function BrowsePage() {
  const t = useTranslations()
  const [searchText, setSearchText] = useState('')
  const [toggle, setToggle] = useState(false)
  // const [from, setFrom] = useState('')
  // const [to, setTo] = useState('')
  const [dataFetch, setDataFetch] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  // const [fetchAvailable, setFetchAvailable] = useState(false)

  const debounceSearch = useDebounce(searchText.trim(), 300)

  const offset = useMemo(() => (page - 1) * 24, [page])

  const { isLoading } = useSWR(
    ['usernamenfts api', debounceSearch, offset],
    () => fetchUsernameNfts(offset, debounceSearch),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnMount: false,
    },
  )

  // const { isLoading: isLoadingAvailable } = useSWR(
  //   ['available api', offset, debounceSearch],
  //   () => fetchAvailableData(offset, debounceSearch),
  //   {
  //     refreshInterval: 30000,
  //     revalidateOnFocus: false,
  //     revalidateOnMount: false,
  //   },
  // )

  // const { isLoading } = useSWR(
  //   ['usernamenfts api', debounceSearch, offset],
  //   () => fetchUsernameNfts(offset, debounceSearch),
  //   {
  //     refreshInterval: 30000,
  //     revalidateOnFocus: false,
  //     revalidateOnMount: false,
  //   },
  // )

  useEffect(() => {
    setDataFetch([])
    setHasMore(true)
    setPage(1)
  }, [debounceSearch])

  const getMore = useCallback(async () => {
    // if (!fetchAvailable) {
    //   dataMore = await mutate(['usernamenfts api', debounceSearch, offset])
    // } else {
    //   dataMore = await mutate(['available api', offset, debounceSearch])
    // }
    const dataMore = await mutate(['usernamenfts api', debounceSearch, offset])
    setDataFetch([...dataFetch, ...dataMore])
    if (dataMore.length > 0) {
      setHasMore(true)
    } else {
      setPage(1)
      setHasMore(false)
      // setFetchAvailable(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, debounceSearch])

  useEffect(() => {
    getMore()
  }, [getMore])

  return (
    <div className='mt-6'>
      <div className='mb-6'>
        <h2>{t('Browse THENA IDs')}</h2>
      </div>
      <div className='mb-8 flex flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <SearchInput
            className='h-11 w-full md:w-[336px]'
            classNames={{ input: 'h-11' }}
            val={searchText}
            setVal={setSearchText}
            autoFocus
          />
        </div>
        <div className='flex items-center gap-1'>
          <Toggle toggleId='availableThenaIds' checked={toggle} onChange={() => setToggle(!toggle)} />
          <TextHeading>{t('Available THENA IDs')}</TextHeading>
        </div>
      </div>
      <div className='flex flex-col gap-6 md:flex-row'>
        {/* <div className='w-full sm:w-[320px]'>
          <div className='mb-6 w-full'>
            <TextHeading className='mb-3 block'>Length</TextHeading>
            <div className='flex flex-row justify-between gap-3'>
              <Input val={from} setVal={setFrom} />
              <Input val={to} setVal={setTo} />
            </div>
          </div>
          <div className='w-full'>
            <TextHeading className='mb-3 block'>Character Set</TextHeading>
          </div>
        </div> */}
        <div className='flex-1'>
          <InfiniteScroll dataLength={dataFetch.length} next={() => setPage(page + 1)} hasMore={hasMore}>
            <div className='grid grid-cols-2 items-center gap-6 lg:grid-cols-3 2xl:grid-cols-4'>
              {dataFetch.map(item => (
                <div key={item.name} className='w-full rounded-lg'>
                  <div className='rounded-t-lg bg-neutral-300'>
                    <ImageThenaId name={item.name} fontSize={110} />
                  </div>
                  <Box className='rounded-b-lg rounded-t-none px-3 lg:px-3'>
                    <TextHeading className='text-sm'>{item.name}.thena</TextHeading>
                  </Box>
                </div>
              ))}
            </div>
          </InfiniteScroll>
          {isLoading && (
            <div className='grid grid-cols-2 items-center gap-6 lg:grid-cols-3 2xl:grid-cols-4'>
              {new Array(12).fill(1).map((_, index) => (
                <div key={index} className='w-full rounded-lg'>
                  <Skeleton className='h-full w-full' />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BrowsePage
