'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import SearchInput from '@/components/input/SearchInput'
import Tabs from '@/components/tabs'
import { addOrReplaceURLParams } from '@/lib/tradingCompetition/utils'

export function AchievementWrapLayout({ children }) {
  const searchParams = useSearchParams()
  const [searchText, setSearchText] = useState(searchParams.get('q') ?? undefined)
  const pathname = usePathname()

  const subTabs = [
    {
      label: 'All',
      active: pathname === '/arena/achievements',
      isLink: true,
      href: '/arena/achievements',
    },
    {
      label: 'Completed',
      active: pathname === '/arena/achievements/completed',
      isLink: true,
      href: '/arena/achievements/completed',
    },
    {
      label: 'Not Completed',
      active: pathname === '/arena/achievements/not-completed',
      isLink: true,
      href: '/arena/achievements/not-completed',
    },
  ]

  useEffect(() => {
    addOrReplaceURLParams('q', searchText || null)
  }, [searchText])

  return (
    <div className='mt-6 space-y-10'>
      <div className='flex flex-col justify-between gap-4 lg:w-auto lg:flex-row lg:gap-2'>
        <div className='rounded-lg bg-neutral-900 p-1 '>
          <Tabs data={subTabs} itemClassName='text-sm' />
        </div>
        <div className='flex gap-4'>
          <SearchInput
            className='h-11 w-full lg:w-[336px]'
            classNames={{ input: 'h-11' }}
            val={searchText}
            setVal={setSearchText}
          />
        </div>
      </div>
      {children}
    </div>
  )
}
