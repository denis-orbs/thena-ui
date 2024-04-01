'use client'

import { gql } from 'graphql-request'
import { cloneDeep, compact, sortBy } from 'lodash'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { PrimaryButton } from '@/components/buttons/Button'
import SearchInput from '@/components/input/SearchInput'
import Tabs from '@/components/tabs'
import { SizeTypes } from '@/constant/type'
import { useAssets } from '@/context/assetsContext'
import { useTCManagerInfo } from '@/hooks/useTCManager'
import { v4Client } from '@/lib/graphql'
import { addOrReplaceURLParams } from '@/lib/tradingCompetition/utils'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import CompetitionItem from './CompetitionItem'
import FilterDropDown, { FILTERS } from './FilterDropDown'
import NoCompetition from './NoCompetition'
import Loading from '../loading'

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
      }
      prize {
        totalPrize
        token
      }
      timestamp {
        endTimestamp
        startTimestamp
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

export default function ArenaPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const { account } = useWallet()
  const { isAllowed } = useTCManagerInfo()

  const { data: dataCompetitions } = useSWR('competition api', () => fetchCompetition())

  const assets = useAssets()

  const [selectedTab, setSelectedTab] = useState()

  const [showTab, setShowTab] = useState({
    upcoming: false,
    all: false,
    joined: false,
    live: false,
    hosted: false,
    ended: false,
  })

  const [searchText, setSearchText] = useState(searchParams.get('search') ?? '')

  const [filter, setFilter] = useState({
    market: searchParams.get('market') ?? 'all',
    sortBy: searchParams.get('sortBy') ?? 'Default',
    free: !!searchParams.get('free'),
  })

  const competitions = useMemo(
    () =>
      dataCompetitions?.map(comp => ({
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

  const filterCompetitions = useMemo(() => {
    if (!selectedTab) {
      return []
    }
    let result = cloneDeep(competitions || []) ?? []
    if (filter.market !== 'all') {
      result = result.filter(item => item.market.toLowerCase() === filter.market.toLowerCase())
    }
    switch (filter.sortBy) {
      case FILTERS.entryFee:
        result = sortBy(result, o => parseInt(o.entryFee, 10))
        break

      case FILTERS.totalPrize:
        result = sortBy(result, o => -parseInt(o.prize.totalPrize, 10))
        break

      case FILTERS.participantCount:
        result = sortBy(result, o => -parseInt(o.participantCount, 10))
        break

      default:
        result = cloneDeep(result)
    }

    switch (selectedTab) {
      case 'upcoming':
        result = result.filter(item => item.timestamp.startTimestamp > new Date().getTime() / 1000)
        break

      case 'joined':
        result = result.filter(item =>
          item.participants?.find(participant => participant?.participant.id === account?.toLowerCase()),
        )
        break

      case 'hosted':
        result = result.filter(item => account?.toLowerCase() === item.owner.id)
        break

      case 'ended':
        result = result.filter(
          item =>
            item.timestamp.endTimestamp < new Date().getTime() / 1000 &&
            item?.participant?.id === account?.toLowerCase(),
        )
        break

      default:
        result = cloneDeep(result)
    }

    if (filter.free) {
      result = result.filter(item => fromWei(item.entryFee).isZero())
    }

    return !searchText.trim().length
      ? result
      : result.filter(
          item =>
            item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchText.toLowerCase()),
        )
  }, [competitions, filter.market, filter.sortBy, filter.free, selectedTab, searchText, account])

  const subTabs = useMemo(
    () =>
      compact([
        showTab.upcoming
          ? {
              label: t('Upcoming'),
              active: selectedTab === 'upcoming',
              onClickHandler: () => {
                setSelectedTab('upcoming')
              },
            }
          : undefined,
        showTab.live
          ? {
              label: t('Live'),
              active: selectedTab === 'live',
              onClickHandler: () => {
                setSelectedTab('live')
              },
            }
          : undefined,
        {
          label: t('All'),
          active: selectedTab === 'all',
          onClickHandler: () => {
            setSelectedTab('all')
          },
        },
        showTab.joined
          ? {
              label: t('Joined'),
              active: selectedTab === 'joined',
              onClickHandler: () => {
                setSelectedTab('joined')
              },
            }
          : undefined,
        showTab.hosted
          ? {
              label: t('Hosted'),
              active: selectedTab === 'hosted',
              onClickHandler: () => {
                setSelectedTab('hosted')
              },
            }
          : undefined,

        showTab.ended
          ? {
              label: t('Ended'),
              active: selectedTab === 'ended',
              onClickHandler: () => {
                setSelectedTab('ended')
              },
            }
          : undefined,
      ]),
    [showTab.upcoming, showTab.live, showTab.joined, showTab.hosted, showTab.ended, t, selectedTab],
  )

  useEffect(() => {
    addOrReplaceURLParams('search', searchText.length ? searchText : null)
    addOrReplaceURLParams('free', filter.free ? true : null)
    addOrReplaceURLParams('market', filter.market !== 'all' ? filter.market : null)
    addOrReplaceURLParams('sortBy', filter.sortBy !== 'Default' ? filter.sortBy : null)
  }, [filter.free, filter.market, filter.sortBy, searchText])

  useEffect(() => {
    if (competitions) {
      const hasUpcoming = competitions?.some(item => item.timestamp.startTimestamp > new Date().getTime() / 1000)
      setSelectedTab(hasUpcoming ? 'upcoming' : 'all')
      setShowTab({
        all: true,
        ended: competitions?.some(
          item =>
            account &&
            item.timestamp.endTimestamp < new Date().getTime() / 1000 &&
            item.participant?.id === account.toLowerCase(),
        ),
        hosted: competitions?.some(item => account && account.toLowerCase() === item.owner.id),
        joined: competitions?.some(
          item =>
            account && item.participants?.find(participant => participant?.participant.id === account.toLowerCase()),
        ),
        live: competitions?.some(
          item =>
            item.timestamp.startTimestamp <= new Date().getTime() / 1000 &&
            item.timestamp.endTimestamp >= new Date().getTime() / 1000,
        ),
        upcoming: hasUpcoming,
      })
    }
  }, [account, competitions])

  if (!filterCompetitions.length && !selectedTab) return <Loading />

  return (
    <div className='mt-6 flex flex-col gap-4'>
      <div className='flex flex-col justify-between gap-4'>
        <div className='flex justify-between'>
          <h2>{t('Competitions')}</h2>
          {Boolean(isAllowed) && <PrimaryButton>{t('Add Competition')}</PrimaryButton>}
        </div>
        <div className='flex flex-col justify-between gap-4 lg:w-auto lg:flex-row lg:gap-2'>
          <div className='rounded-lg bg-neutral-900 p-1 '>
            <Tabs data={subTabs} size={SizeTypes.Small} itemClassName='text-sm' />
          </div>
          <div className='flex gap-4'>
            <SearchInput
              className='h-11 w-full lg:w-[336px]'
              classNames={{ input: 'h-11' }}
              val={searchText}
              setVal={setSearchText}
            />
            <FilterDropDown filter={filter} setFilter={setFilter} />
          </div>
        </div>
      </div>
      <div className='w-full'>
        <h3>{t('All Competitions')}</h3>
      </div>
      {filterCompetitions?.length ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filterCompetitions.map(item => (
            <CompetitionItem competition={item} key={item.id} tokens={assets} account={account} />
          ))}
        </div>
      ) : (
        <NoCompetition />
      )}
    </div>
  )
}
