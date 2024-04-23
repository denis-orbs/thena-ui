'use client'

import { ethers } from 'ethers'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import Tabs from '@/components/tabs'
import { Paragraph } from '@/components/typography'
import { SizeTypes } from '@/constant/type'
import { sliceAddress } from '@/lib/utils'

const tabs = ['All', 'Hosted', 'Joined']
const tabsFilterTime = ['24h', '7d', '30d', 'Max']

function TopUser() {
  const sortOptions = useMemo(
    () => [
      {
        label: <span>#</span>,
        value: 'rank',
        width: 'w-[10%]',
        disabled: true,
      },
      {
        label: 'User',
        value: 'user',
        width: 'w-[30%]',
        isDesc: true,
      },
      {
        label: 'Competition name',
        value: 'competitionName',
        width: 'w-[30 %]',
        disabled: true,
      },
      {
        label: 'Profit / Loss',
        value: 'pnl',
      },
    ],
    [],
  )

  const t = useTranslations()
  const [searchText, setSearchText] = useState('')
  const [selectedTab, setSelectedTab] = useState(tabs[0])
  const [selectedTabTime, setSelectedTabTime] = useState(tabsFilterTime[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[1])

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

  const subTabsTime = useMemo(
    () =>
      tabsFilterTime.map(tab => ({
        label: t(tab),
        active: tab === selectedTabTime,
        onClickHandler: () => {
          setSelectedTabTime(tab)
        },
      })),
    [selectedTabTime, t],
  )

  const data = Array(13)
    .fill(1)
    .map(() => ({
      user: ethers.Wallet.createRandom().address,
      avatar: '',
      competitionName: `Competition ${ethers.Wallet.createRandom().fingerprint}`,
      pnl: (Math.random() - 0.5) * 1000,
    }))

  console.log({ data })

  const sortedData = useMemo(
    () =>
      data.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'user':
            res = String(a.user).localeCompare(String(b.user)) * (sort.isDesc ? -1 : 1)
            break
          case 'competitionName':
            res = String(a.competitionName).localeCompare(String(b.competitionName)) * (sort.isDesc ? -1 : 1)
            break
          case 'pnl':
            res = (a.pnl - b.pnl) * (sort.isDesc ? -1 : 1)
            break
          default:
            break
        }
        return res
      }),
    [data, sort],
  )

  const finalData = useMemo(
    () =>
      sortedData?.map((item, index) => ({
        rank: <Paragraph>{index + 1}</Paragraph>,
        user: <Paragraph>{sliceAddress(item.user)}</Paragraph>,
        competitionName: <Paragraph>{item.competitionName}</Paragraph>,
        pnl: (
          <Paragraph className={item.pnl < 0 ? 'text-red-500' : item.pnl > 0 ? 'text-green-500' : ''}>
            {item.pnl < 0 ? '-' : item.pnl > 0 ? '+' : ''} $
            {item.pnl < 0 ? item.pnl.toFixed(3) * -1 : item.pnl.toFixed(3)}
          </Paragraph>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData)],
  )

  return (
    <div className='col-span-12 lg:col-span-7'>
      <div className='flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between'>
        <Tabs data={subTabs} size={SizeTypes.Medium} itemClassName='text-sm' />
        <SearchInput
          className='h-11 w-full lg:w-[336px]'
          classNames={{ input: 'h-11' }}
          val={searchText}
          setVal={setSearchText}
        />
      </div>
      <div className='mt-6 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between'>
        <div>select</div>
        <div className='rounded-lg bg-neutral-900 p-1 '>
          <Tabs data={subTabsTime} size={SizeTypes.Small} itemClassName='text-sm' />
        </div>
      </div>
      <div className='mt-6'>
        <Table
          sort={sort}
          setSort={setSort}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          tableBasic
          data={finalData}
          sortOptions={sortOptions}
        />
      </div>
    </div>
  )
}

export default TopUser
