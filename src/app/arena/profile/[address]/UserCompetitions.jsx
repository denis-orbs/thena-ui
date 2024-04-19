'use client'

import { compact } from 'lodash'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import SearchInput from '@/components/input/SearchInput'
import Tabs from '@/components/tabs'
import { TextHeading } from '@/components/typography'
import { SizeTypes } from '@/constant/type'

import CompetitionItem from '../../CompetitionItem'

export function UserCompetitions({ hostedCompetitions, joinedTCs }) {
  const initSelectedTab = useMemo(
    () => compact([joinedTCs.length ? 'Joined' : undefined, hostedCompetitions.length ? 'Hosted' : undefined]),
    [hostedCompetitions.length, joinedTCs.length],
  )
  const t = useTranslations()
  const [searchText, setSearchText] = useState('')

  const [selectedTab, setSelectedTab] = useState(initSelectedTab[0])

  const competitionByTab = useMemo(() => {
    if (selectedTab === 'Joined') {
      return joinedTCs
    }
    if (selectedTab === 'Hosted') {
      return hostedCompetitions
    }

    return []
  }, [hostedCompetitions, joinedTCs, selectedTab])

  const subTabs = useMemo(
    () =>
      compact([
        joinedTCs.length
          ? {
              label: t('Joined'),
              active: selectedTab === 'Joined',
              onClickHandler: () => {
                setSelectedTab('Joined')
              },
            }
          : undefined,
        hostedCompetitions.length
          ? {
              label: t('Hosted'),
              active: selectedTab === 'Hosted',
              onClickHandler: () => {
                setSelectedTab('Hosted')
              },
            }
          : undefined,
      ]),
    [hostedCompetitions, joinedTCs, selectedTab, t],
  )

  const filterCompetitions = useMemo(
    () =>
      !searchText.trim().length
        ? competitionByTab
        : competitionByTab.filter(
            item =>
              item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
              item.description?.toLowerCase().includes(searchText.toLowerCase()),
          ),
    [competitionByTab, searchText],
  )

  return (
    <div>
      <TextHeading className='text-xl'>{t('Competitions')}</TextHeading>
      <div className='flex flex-col items-start justify-between lg:flex-row lg:items-center'>
        <Tabs
          data={subTabs}
          size={SizeTypes.Small}
          itemClassName='text-sm'
          className='flex-2 justify-start overflow-x-auto'
        />
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>
      <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {filterCompetitions.map(item => (
          <CompetitionItem competition={item} key={item.id} />
        ))}
      </div>
    </div>
  )
}
