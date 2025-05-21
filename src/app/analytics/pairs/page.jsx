'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Loading from '@/app/loading'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import SearchInput from '@/components/input/SearchInput'
import { TextHeading } from '@/components/typography'
import { usePairs } from '@/context/pairsContext'

import PairsTable from './PairsTable'

export default function AnalyticsPairsPage() {
  const [searchText, setSearchText] = useState('')
  const { pairs, isLoading } = usePairs()
  const t = useTranslations()

  const filteredPairs = useMemo(
    () => (pairs ? pairs.filter(pair => (pair.symbol || '').toLowerCase().includes(searchText.toLowerCase())) : []),
    [pairs, searchText],
  )

  if (isLoading || !pairs) {
    return <Loading />
  }

  return (
    <LayoutWithBackButton>
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <TextHeading className='text-xl'>{t('Pairs')}</TextHeading>
            <SearchInput val={searchText} setVal={setSearchText} placeholder='Search' />
          </div>
          <PairsTable data={filteredPairs} />
        </div>
      </div>
    </LayoutWithBackButton>
  )
}
