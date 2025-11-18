'use client'

import { useQuery } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import SearchInput from '@/components/input/SearchInput'
import Skeleton from '@/components/skeleton'
import useDebounce from '@/hooks/useDebounce'
import { ArenaClient } from '@/lib/graphql'

import ThenaIdItem from './ThenaIdItem'

const V4_USERNAME_NFTS = gql`
  query V4_USERNAME_NFTS($offset: Int = 0, $where: UsernameNftWhereInput = {}) {
    usernameNfts(orderBy: id_DESC, offset: $offset, limit: 24, where: $where) {
      id
      name
      timestamp
      cost
      owner {
        id
        username
        nameColor
        avatar
        checkMarkIcon
        isVerified
      }
    }
  }
`

const fetchUsernameNfts = async (page = 1, debounceSearch = '', signal = undefined) => {
  try {
    let where = {}
    if (debounceSearch) {
      where = {
        name_containsInsensitive: debounceSearch,
      }
    }

    const { usernameNfts } = await ArenaClient.request({
      document: V4_USERNAME_NFTS,
      variables: {
        offset: (page - 1) * 24,
        where,
      },
      signal,
    })

    return usernameNfts
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

const V4_AVAILABLE = gql`
  query V4_AVAILABLE($offset: Int = 0, $where: ThenaIdAvailableWhereInput = {}) {
    thenaIdAvailables(offset: $offset, orderBy: id_ASC, limit: 24, where: $where) {
      id
      cost
      name
      trait
    }
  }
`

const fetchAvailableThenaIds = async (page = 1, debounceSearch = '', signal = undefined) => {
  try {
    let where = {}
    if (debounceSearch) {
      where = {
        name_containsInsensitive: debounceSearch,
      }
    }
    const { thenaIdAvailables } = await ArenaClient.request({
      document: V4_AVAILABLE,
      variables: {
        offset: (page - 1) * 24,
        where,
      },
      signal,
    })

    return thenaIdAvailables
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

// function

function BrowsePage() {
  const t = useTranslations()
  const [searchText, setSearchText] = useState('')
  // const [from, setFrom] = useState('')
  // const [to, setTo] = useState('')
  const [usernameNfts, setUsernameNfts] = useState(new Map())
  const [usernameNftsPage, setUsernameNftsPage] = useState(1)
  const [hasMoreUsernameNfts, setHasMoreUsernameNfts] = useState(true)
  const [lastElement, setLastElement] = useState(null)
  const [isFetchAvailable, setIsFetchAvailable] = useState(false)
  const [availableThenaIds, setAvailableThenaIds] = useState(new Map())
  const [availableThenaIdsPage, setAvailableThenaIdsPage] = useState(1)
  const [hasMoreAvailableThenaIds, setHasMoreAvailableThenaIds] = useState(true)

  const debounceSearch = useDebounce(searchText.trim(), 300)

  const { data: usernameNftsRes, isLoading: isLoadingUsernameNfts } = useQuery({
    queryKey: ['browse username nfts', usernameNftsPage, debounceSearch],
    queryFn: async ({ signal }) => await fetchUsernameNfts(usernameNftsPage, debounceSearch, signal),
  })

  const { data: availableThenaIdsRes, isLoading: isLoadingAvailableThenaIdsRes } = useQuery({
    queryKey: ['browse available thena ids', availableThenaIdsPage, debounceSearch],
    queryFn: async ({ signal }) => await fetchAvailableThenaIds(availableThenaIdsPage, debounceSearch, signal),
    enabled: isFetchAvailable,
  })

  useEffect(() => {
    if (usernameNftsRes) {
      if (Array.isArray(usernameNftsRes)) {
        if (usernameNftsRes.length !== 24) {
          setIsFetchAvailable(true)
          setHasMoreUsernameNfts(false)
        }
        setUsernameNfts(old => {
          let temp
          if (usernameNftsPage === 1) {
            temp = new Map()
          } else {
            temp = new Map(old)
          }
          usernameNftsRes.forEach(ele => {
            temp.set(ele.id, ele)
          })
          return temp
        })
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameNftsRes])

  useEffect(() => {
    if (availableThenaIdsRes) {
      if (Array.isArray(availableThenaIdsRes)) {
        if (availableThenaIdsRes.length !== 24) {
          setHasMoreAvailableThenaIds(false)
        }
        setAvailableThenaIds(old => {
          let temp
          if (availableThenaIdsPage === 1) {
            temp = new Map()
          } else {
            temp = new Map(old)
          }
          availableThenaIdsRes.forEach(ele => {
            temp.set(ele.name, ele)
          })
          return temp
        })
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableThenaIdsRes])

  useEffect(() => {
    if (isLoadingUsernameNfts && usernameNftsPage === 1) {
      setUsernameNfts(new Map())
    }
  }, [isLoadingUsernameNfts, usernameNftsPage])

  useEffect(() => {
    if (!isFetchAvailable || (isLoadingAvailableThenaIdsRes && availableThenaIdsPage === 1)) {
      setAvailableThenaIds(new Map())
    }
  }, [isLoadingAvailableThenaIdsRes, availableThenaIdsPage, isFetchAvailable])

  useEffect(() => {
    setIsFetchAvailable(false)
    setHasMoreUsernameNfts(true)
    setHasMoreAvailableThenaIds(true)
    setUsernameNftsPage(1)
    setAvailableThenaIdsPage(1)
  }, [debounceSearch])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentElement = lastElement

      const observer = new IntersectionObserver(entries => {
        const first = entries[0]
        if (first.isIntersecting) {
          if (isFetchAvailable) {
            setAvailableThenaIdsPage(pre => pre + 1)
          } else {
            setUsernameNftsPage(pre => pre + 1)
          }
        }
      })

      if (observer) {
        if (currentElement) {
          observer.observe(currentElement)
        }

        return () => {
          if (currentElement) {
            observer.unobserve(currentElement)
          }
        }
      }
    }
  }, [isFetchAvailable, lastElement])

  return (
    <div className='mt-6'>
      <div className='mb-6'>
        <h2>{t('Browse THENA IDs')}</h2>
      </div>
      <div className='mb-6 flex items-center gap-6'>
        <EmphasisButton>
          <Link href='/arena/thena-id/recently-minted' prefetch={false}>
            {t('Recent THENA ID Mints')}
          </Link>
        </EmphasisButton>
        <EmphasisButton>
          <Link href='/arena/thena-id/available' prefetch={false}>
            {t('Available THENA IDs')}
          </Link>
        </EmphasisButton>
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
          <div className='grid grid-cols-2 items-start gap-4 md:gap-6 lg:grid-cols-3 2xl:grid-cols-4 2xl:gap-8'>
            {Array.from(usernameNfts.values()).map((item, index) =>
              index === usernameNfts.size - 1 && hasMoreUsernameNfts ? (
                <div className='last-index' key={item.id} ref={setLastElement}>
                  <ThenaIdItem item={item} />
                </div>
              ) : (
                <ThenaIdItem item={item} key={item.id} />
              ),
            )}
            {isLoadingUsernameNfts &&
              new Array(12).fill(1).map((_, index) => (
                <div key={index} className='w-full rounded-lg'>
                  <Skeleton className='h-[350px]' />
                </div>
              ))}
            {Array.from(availableThenaIds.values()).map((item, index) =>
              index === availableThenaIds.size - 1 && hasMoreAvailableThenaIds ? (
                <div className='last-index-available' key={item.id} ref={setLastElement}>
                  <ThenaIdItem item={item} />
                </div>
              ) : (
                <ThenaIdItem item={item} key={item.id} />
              ),
            )}
            {isLoadingAvailableThenaIdsRes &&
              new Array(12).fill(1).map((_, index) => (
                <div key={index} className='w-full rounded-lg'>
                  <Skeleton className='h-[350px]' />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrowsePage
