'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { TextButton } from '@/components/buttons/Button'
import SearchInput from '@/components/input/SearchInput'
import Spinner from '@/components/spinner'
import { TextHeading } from '@/components/typography'
import { usePairs } from '@/context/pairsContext'
import { ArrowLeftIcon } from '@/svgs'

import PairsTable from './PairsTable'

export default function AnalyticsPairsPage() {
  const [searchText, setSearchText] = useState('')
  const { push } = useRouter()
  const { pairs, isLoading } = usePairs()
  const filteredPairs = useMemo(
    () => (pairs ? pairs.filter(pair => pair.symbol.toLowerCase().includes(searchText.toLowerCase())) : []),
    [pairs, searchText],
  )
  if (isLoading || !pairs) {
    return (
      <div className='flex w-full items-center'>
        <Spinner />
      </div>
    )
  }
  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-4'>
        <TextButton className='w-fit' LeadingIcon={ArrowLeftIcon} onClick={() => push('/analytics')}>
          Back
        </TextButton>
      </div>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <TextHeading className='text-xl'>Pairs</TextHeading>
          <SearchInput val={searchText} setVal={setSearchText} placeholder='Search' />
        </div>
        <PairsTable data={filteredPairs} />
      </div>
    </div>
  )
}
