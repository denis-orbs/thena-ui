import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import React, { useEffect, useState } from 'react'
import { Popover } from 'react-tiny-popover'
import useSWR from 'swr'

import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'
import { SearchIcon } from '@/svgs'

import SearchContent from './SearchContent'
import SearchInput from '../../components/input/SearchInput'

const V4_USERS_COMPETITIONS = gql`
  query V4_USERS_COMPETITIONS($search: String!) {
    tradingCompetitions(where: { name_containsInsensitive: $search }) {
      id
      name
      bannerUrl
      defaultBannerUrl
      timestamp {
        endTimestamp
        registrationEnd
        registrationStart
        startTimestamp
      }
      market
      prizeUpdate {
        ownerFee
        token
        totalPrize
        weights
        winType
      }
      owner {
        id
        isVerified
        avatar
        username
        nameColor
        checkMarkIcon
        verifiedAt
      }
    }
    users(where: { OR: [{ id_containsInsensitive: $search }, { username_containsInsensitive: $search }] }) {
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

const fetchData = async search => {
  try {
    if (search) {
      const { users, tradingCompetitions } = await v4Client.request(V4_USERS_COMPETITIONS, { search })

      const sortUsers = users.sort((a, b) => {
        if (a.isSuperAdmin && !b.isSuperAdmin) return -1
        if (!a.isSuperAdmin && b.isSuperAdmin) return 1

        if (a.isAdmin && !b.isAdmin) return -1
        if (!a.isAdmin && b.isAdmin) return 1

        if (a.isVerified && !b.isVerified) return -1
        if (!a.isVerified && b.isVerified) return 1

        return 0
      })

      const sortTCs = tradingCompetitions.sort((a, b) => {
        const now = dayjs().unix()

        const aHasStarted = a.timestamp.startTimestamp < now
        const bHasStarted = b.timestamp.startTimestamp < now
        const aHasEnded = a.timestamp.endTimestamp < now
        const bHasEnded = b.timestamp.endTimestamp < now

        // Competitions that haven't started yet come first
        if (!aHasStarted && bHasStarted) return -1
        if (aHasStarted && !bHasStarted) return 1

        // Among those that haven't started yet, sort by start time ascending
        if (!aHasStarted && !bHasStarted) return a.timestamp.startTimestamp - b.timestamp.startTimestamp

        // Competitions that have started but haven't ended come next
        if (aHasStarted && !aHasEnded && bHasStarted && !bHasEnded) {
          return a.timestamp.endTimestamp - b.timestamp.endTimestamp
        }

        // Competitions that have ended come last
        if (aHasEnded && !bHasEnded) return 1
        if (!aHasEnded && bHasEnded) return -1

        // Among those that have ended, sort by end time descending
        if (aHasEnded && bHasEnded) return b.timestamp.endTimestamp - a.timestamp.endTimestamp

        return 0
      })
      return { users: sortUsers, tradingCompetitions: sortTCs }
    }
  } catch (error) {
    console.error(error)
    return { users: [], tradingCompetitions: [] }
  }
}

export function HeaderSearch({ setToggleSearch, toggleSearch, isSmallScreen }) {
  const [searchText, setSearchText] = useState('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const debounceSearch = useDebounce(searchText, 300)

  const { data, isLoading } = useSWR(['search users and competitions', debounceSearch], () => fetchData(debounceSearch))

  useEffect(() => {
    if (!isLoading && searchText) {
      setIsPopoverOpen(true)
    }
  }, [isLoading, searchText])

  useEffect(() => {
    if (!searchText) {
      setIsPopoverOpen(false)
    }
  }, [searchText])

  return (
    <Popover
      isOpen={isPopoverOpen}
      positions='bottom'
      padding={3}
      onClickOutside={() => setIsPopoverOpen(false)}
      content={
        <SearchContent tradingCompetitions={data?.tradingCompetitions} users={data?.users} isLoading={isLoading} />
      }
      containerStyle={{
        zIndex: '100',
      }}
    >
      <div
        className='flex items-center justify-center'
        style={
          isSmallScreen && toggleSearch
            ? {
                width: '100%',
              }
            : {}
        }
        onClick={() => {
          if (searchText) {
            setIsPopoverOpen(true)
          }
        }}
      >
        {isSmallScreen ? (
          toggleSearch ? (
            <SearchInput
              className='h-11 w-full lg:w-[360px]'
              classNames={{ input: 'h-11' }}
              val={searchText}
              setVal={setSearchText}
              placeholder='Search Trading Competition Users'
              showIconClose={isSmallScreen}
              onClear={() => {
                if (isSmallScreen) {
                  setToggleSearch(!toggleSearch)
                }
              }}
            />
          ) : (
            <SearchIcon className='h-5 w-5' onClick={() => setToggleSearch(!toggleSearch)} />
          )
        ) : (
          <SearchInput
            className='h-11 w-full lg:w-[360px]'
            classNames={{ input: 'h-11' }}
            val={searchText}
            setVal={setSearchText}
            placeholder='Search Trading Competition Users'
            showIconClose={isSmallScreen}
            onClear={() => {
              if (isSmallScreen) {
                setToggleSearch(!toggleSearch)
              }
            }}
          />
        )}
      </div>
    </Popover>
  )
}
