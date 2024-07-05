import dayjs from 'dayjs'
import React, { useCallback, useEffect, useState } from 'react'
import { Popover } from 'react-tiny-popover'
import useSWR from 'swr'

import useDebounce from '@/hooks/useDebounce'
import { readCall } from '@/lib/contractActions'
import { getThenaIDContract } from '@/lib/contracts'
import { v4Client } from '@/lib/graphql'
import { SearchIcon } from '@/svgs'

import {
  V4_ID_COUNT,
  V4_ID_SEARCH,
  V4_MINTED_ID_SEARCH,
  V4_USERS_COMPETITIONS,
  V4_USERS_COUNT,
  V4_USERS_SEARCH,
} from './constants'
import SearchContent from './SearchContent'
import SearchInput from '../../components/input/SearchInput'

const fetchData = async search => {
  try {
    if (search) {
      const { tradingCompetitions } = await v4Client.request(V4_USERS_COMPETITIONS, { search })
      const { usersTotalCount } = await v4Client.request(V4_USERS_COUNT, { search })
      const { users } = await v4Client.request(V4_USERS_SEARCH, { search })

      const { usernameNfts: mintedId } = await v4Client.request(V4_MINTED_ID_SEARCH, { search })

      const { usernameNftsCountForSearch } = await v4Client.request(V4_ID_COUNT, { search })
      let usernameNftsCount = usernameNftsCountForSearch

      const thenaIds = mintedId.length
        ? mintedId.map(item => ({
            ...item,
            available: false,
          }))
        : []

      const contract = getThenaIDContract()
      if (contract) {
        const valid = await readCall(contract, 'validateUsername', [search])

        if (valid) {
          const { usernameNfts: idSearch } = await v4Client.request(V4_ID_SEARCH, { search })
          const _idSearch = idSearch.length
            ? {
                ...idSearch[0],
                available: false,
              }
            : {
                id: 'new',
                avatar: undefined,
                name: search,
                available: true,
              }
          usernameNftsCount += 1
          thenaIds.unshift(_idSearch)
        }
      }

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
      return {
        users,
        usersTotalCount,
        tradingCompetitions: sortTCs,
        thenaIds,
        thenaIdsCount: usernameNftsCount,
      }
    }
  } catch (error) {
    console.error(error)
    return {
      users: [],
      usersTotalCount: 0,
      tradingCompetitions: [],
      thenaIds: [],
      thenaIdsCount: 0,
    }
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

  const renderContent = useCallback(
    props => (
      <SearchContent
        tradingCompetitions={data?.tradingCompetitions}
        users={data?.users}
        usersTotalCount={data?.usersTotalCount}
        thenaIds={data?.thenaIds}
        thenaIdTotalCount={data?.thenaIdsCount}
        isLoading={isLoading}
        searchText={debounceSearch}
        setIsPopoverOpen={setIsPopoverOpen}
        width={props?.childRect?.width}
      />
    ),
    [
      data?.thenaIds,
      data?.thenaIdsCount,
      data?.tradingCompetitions,
      data?.users,
      data?.usersTotalCount,
      debounceSearch,
      isLoading,
    ],
  )

  return (
    <Popover
      isOpen={isPopoverOpen}
      positions='bottom'
      padding={3}
      onClickOutside={() => setIsPopoverOpen(false)}
      content={renderContent}
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
