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

  const filteredPairs = useMemo(() => {
    if (!searchText) return pairs
    const searchTerms = searchText
      .toLowerCase()
      .split(/[\s/,]+/)
      .map(term => term.trim())

    return pairs.filter(pool => {
      const poolSymbols = (pool.symbol || '').toLowerCase().split('/')

      if (searchTerms.length === 2 && poolSymbols.length === 2) {
        return (
          (poolSymbols[0].includes(searchTerms[0]) && poolSymbols[1].includes(searchTerms[1])) ||
          (poolSymbols[0].includes(searchTerms[1]) && poolSymbols[1].includes(searchTerms[0]))
        )
      }

      return pool.symbol.toLowerCase().includes(searchText.toLowerCase())
    })
  }, [pairs, searchText])
  if (isLoading || !pairs) {
    return <Loading />
  }

  return (
    <LayoutWithBackButton backUrl='/analytics'>
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <TextHeading className='text-xl'>{t('Pairs')}</TextHeading>
            <SearchInput val={searchText} setVal={setSearchText} placeholder='Search' />
          </div>
          <PairsTable backUrlNumber={4} data={filteredPairs} />
        </div>
      </div>
    </LayoutWithBackButton>
  )
}
