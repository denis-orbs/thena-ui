'use client'

import { gql } from 'graphql-request'
import { cloneDeep } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import SearchInput from '@/components/input/SearchInput'
import Tabs from '@/components/tabs'
import { TextHeading } from '@/components/typography'
import { SizeTypes } from '@/constant/type'
import { useAssets } from '@/context/assetsContext'
import { v4Client } from '@/lib/graphql'

import CompetitionItem from '../CompetitionItem'
import NoCompetition from '../NoCompetition'

const V4_COMPETITION_DATAS = gql`
  query V4_COMPETITION {
    tradingCompetitions {
      name
      entryFee
      market
      id
      competitionRules {
        winningToken
        tradingTokens
        startingBalance
      }
      prize {
        totalPrize
        token
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
      }
      tradingCompetitionSpot
    }
  }
`

const fetchCompetition = async () => {
  try {
    const { tradingCompetitions } = await v4Client.request(V4_COMPETITION_DATAS)
    return tradingCompetitions
  } catch (error) {
    return { error: true }
  }
}

const tabs = ['All', 'Hidden', 'Unhidden']

function Competitions() {
  const t = useTranslations()
  const { data: dataCompetitions } = useSWR('competition api', () => fetchCompetition())
  const [selectedTab, setSelectedTab] = useState(tabs[0])
  const [searchText, setSearchText] = useState('')
  const assets = useAssets()

  const competitions = useMemo(
    () =>
      (dataCompetitions || [])?.map(comp => ({
        ...comp,
        prize: {
          ...comp.prize,
          token: assets.find(ele => ele.address.toLowerCase() === comp.prize.token.toLowerCase()),
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
      })),
    [assets, dataCompetitions],
  )

  const subTabs = useMemo(
    () =>
      tabs.map(tab => ({
        label: t(tab),
        active: tab === selectedTab,
        onClickHandler: () => {
          setSelectedTab(tab)
        },
      })),
    [selectedTab, t],
  )

  const filterCompetitions = useMemo(() => {
    if (!selectedTab) {
      return []
    }
    let result = cloneDeep(competitions || []) ?? []

    switch (selectedTab) {
      case 'All':
        break

      case 'hidden':
        result = result.filter(item => item.hidden)
        break

      case 'unhidden':
        result = result.filter(item => !item.hidden)
        break
      default:
        result = cloneDeep(result)
    }

    return !searchText.trim().length
      ? result
      : result.filter(
          item =>
            item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchText.toLowerCase()),
        )
  }, [competitions, selectedTab, searchText])

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
      {filterCompetitions?.length ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filterCompetitions.map(item => (
            <CompetitionItem competition={item} key={item.id} showCheckedHidden />
          ))}
        </div>
      ) : (
        <NoCompetition />
      )}
    </div>
  )
}

export default Competitions
