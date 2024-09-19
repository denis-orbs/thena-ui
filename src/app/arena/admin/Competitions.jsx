'use client'

import { gql } from 'graphql-request'
import { cloneDeep } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import SearchInput from '@/components/input/SearchInput'
import Tabs from '@/components/tabs'
import { TextHeading } from '@/components/typography'
import { SizeTypes } from '@/constant/type'
import { useAssets } from '@/context/assetsContext'
import useDebounce from '@/hooks/useDebounce'
import { v4Client } from '@/lib/graphql'
import { successToast } from '@/lib/notify'
import { useUpdateTCIsHidden } from '@/modules/Arena/hooks/competitions'

import CompetitionItem from '../CompetitionItem'
import NoCompetition from '../NoCompetition'

const V4_COMPETITION_DATA_WITHOUT_ISHIDDEN = gql`
  query V4_COMPETITION($search: String) {
    tradingCompetitions(orderBy: timestamp_startTimestamp_DESC, where: { name_containsInsensitive: $search }) {
      name
      entryFeeUpdate
      market
      id
      bannerUrl
      isHidden
      competitionRules {
        winningToken
        tradingTokens
        startingBalance
        minimumBalance
      }
      prizeUpdate {
        token
        totalPrize
        weights
      }
      timestamp {
        endTimestamp
        startTimestamp
        registrationStart
        registrationEnd
      }
      participants {
        id
        participant {
          id
        }
      }
      maxParticipants
      participantCount
      owner {
        id
        isVerified
        avatar
        username
        nameColor
        checkMarkIcon
        verifiedAt
      }
      tcAddress
    }
  }
`

const V4_COMPETITION_DATA_WITH_ISHIDDEN = gql`
  query V4_COMPETITION($isHidden: Boolean, $search: String) {
    tradingCompetitions(
      orderBy: timestamp_startTimestamp_DESC
      where: { isHidden_eq: $isHidden, name_containsInsensitive: $search }
    ) {
      name
      entryFeeUpdate
      market
      id
      isHidden
      bannerUrl
      competitionRules {
        winningToken
        tradingTokens
        startingBalance
        minimumBalance
      }
      prizeUpdate {
        token
        totalPrize
        weights
      }
      timestamp {
        endTimestamp
        startTimestamp
        registrationStart
        registrationEnd
      }
      participants {
        id
        participant {
          id
        }
      }
      maxParticipants
      participantCount
      owner {
        id
        isVerified
        avatar
        username
        nameColor
        checkMarkIcon
        verifiedAt
      }
      tcAddress
    }
  }
`

const fetchCompetition = async (tab, search) => {
  try {
    const isHidden = tab === 'All' ? undefined : tab === 'Hidden'
    const { tradingCompetitions } = await v4Client.request(
      isHidden === undefined ? V4_COMPETITION_DATA_WITHOUT_ISHIDDEN : V4_COMPETITION_DATA_WITH_ISHIDDEN,
      isHidden === undefined
        ? {
            search,
          }
        : {
            isHidden,
            search,
          },
    )
    return tradingCompetitions
  } catch (error) {
    return { error: true }
  }
}

const tabs = ['All', 'Hidden', 'Unhidden']

function Competitions() {
  const _assets = useAssets()

  const [selectedTab, setSelectedTab] = useState(tabs[0])
  const [searchText, setSearchText] = useState('')

  const assets = useMemo(() => {
    const clone = cloneDeep(_assets)
    clone.push({
      name: 'MockUSD',
      symbol: 'MUSD',
      decimals: 18,
      address: '0xced4ac14bb1077b995b954c48a87b25ebb4828e5',
    })

    return clone
  }, [_assets])
  const [refetch, setRefetch] = useState(0)
  const [competitions, setCompetitions] = useState([])

  const debounceSearchText = useDebounce(searchText.trim(), 300)

  const { updateTCIsHidden } = useUpdateTCIsHidden()

  const { data: dataCompetitions, isLoading } = useSWR(
    ['competition api', refetch, selectedTab, debounceSearchText],
    () => fetchCompetition(selectedTab, debounceSearchText),
  )

  useEffect(() => {
    if (!isLoading) {
      if (dataCompetitions && Array.isArray(dataCompetitions)) {
        const arrDataFormatted = dataCompetitions.map(comp => ({
          ...comp,
          prizeUpdate: {
            ...comp.prizeUpdate,
            token: comp.prizeUpdate.token.map(token => {
              const asset = assets.find(ele => ele.address.toLowerCase() === token.toLowerCase())
              return asset
            }),
          },
          competitionRules: {
            ...comp.competitionRules,
            winningToken: assets.find(
              ele => ele.address.toLowerCase() === comp.competitionRules.winningToken.toLowerCase(),
            ),
            tradingTokens: assets.filter(ele =>
              comp.competitionRules.tradingTokens.map(sub => sub.toLowerCase()).includes(ele.address),
            ),
          },
        }))

        setCompetitions(arrDataFormatted)
      } else {
        setCompetitions([])
      }
    }
  }, [assets, dataCompetitions, isLoading])

  const subTabs = useMemo(
    () =>
      tabs.map(tab => ({
        label: tab,
        active: tab === selectedTab,
        onClickHandler: () => {
          setSelectedTab(tab)
        },
      })),
    [selectedTab],
  )

  const handleUpdateTCIsHidden = useCallback(
    async ({ isHidden, tcId }) => {
      await updateTCIsHidden({ isHidden, tcId }, () => {
        setRefetch(refetch + 1)
        successToast('Successfully')
      })
    },
    [refetch, updateTCIsHidden],
  )

  return (
    <div>
      <TextHeading className='text-xl'>Competitions</TextHeading>
      <div className='mb-4 mt-6 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between'>
        <Tabs data={subTabs} size={SizeTypes.Medium} itemClassName='text-sm' />
        <SearchInput
          className='h-11 w-full md:w-[420px]'
          classNames={{ input: 'h-11' }}
          val={searchText}
          setVal={setSearchText}
        />
      </div>
      {competitions?.length ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {competitions.map(item => (
            <CompetitionItem
              competition={item}
              key={item.id}
              updateIsHidden={() => handleUpdateTCIsHidden({ isHidden: !item.isHidden, tcId: item.id })}
              showCheckedHidden
            />
          ))}
        </div>
      ) : (
        <NoCompetition />
      )}
    </div>
  )
}

export default Competitions
