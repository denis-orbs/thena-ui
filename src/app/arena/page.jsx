'use client'

import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import SearchInput from '@/components/input/SearchInput'
import Tabs from '@/components/tabs'
import { SizeTypes } from '@/constant/type'
import { v4Client } from '@/lib/graphql'

import CompetitionItem from './CompetitionItem'
import NoCompetition from './NoCompetition'

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
      owner {
        id
      }
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

  const { data: competitions } = useSWR('competition api', () => fetchCompetition(), {
    refreshInterval: 60000,
  })

  const [selectedTab, setSearchTab] = useState('all')

  const submenus = useMemo(
    () => [
      {
        label: t('Browse all'),
        active: selectedTab === 'all',
        onClickHandler: () => {
          setSearchTab('all')
        },
      },
      {
        label: t('Joined'),
        active: selectedTab === 'join',
        onClickHandler: () => {
          setSearchTab('join')
        },
      },
      {
        label: t('Hosted'),
        active: selectedTab === 'host',
        onClickHandler: () => {
          setSearchTab('host')
        },
      },
      {
        label: t('Past'),
        active: selectedTab === 'past',
        onClickHandler: () => {
          setSearchTab('past')
        },
      },
    ],
    [selectedTab, t],
  )

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col justify-between gap-4'>
        <div className='flex justify-between'>
          <h2>{t('Competitions')}</h2>
          <PrimaryButton>{t('Add competition')}</PrimaryButton>
        </div>
        <div className='flex flex-col justify-between gap-4 lg:w-auto lg:flex-row lg:gap-2'>
          <div className='rounded-lg bg-neutral-900 p-1 '>
            <Tabs data={submenus} size={SizeTypes.Small} itemClassName='text-sm' />
          </div>
          <div className='flex gap-4'>
            <SearchInput className='h-11 w-full lg:w-[336px]' classNames={{ input: 'h-11' }} val='' setVal={() => {}} />
            <EmphasisButton>{t('Filter')}</EmphasisButton>
          </div>
        </div>
      </div>
      <div className='w-full'>
        <h3>{t('All Competitions')}</h3>
      </div>
      {competitions?.length ? (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
          {competitions.map(item => (
            <CompetitionItem competition={item} />
          ))}
        </div>
      ) : (
        <NoCompetition />
      )}
    </div>
  )
}
