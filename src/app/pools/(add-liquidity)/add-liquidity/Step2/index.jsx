import { useSearchParams } from 'next/navigation'
import React from 'react'

import { PAIR_TYPES } from '@/constant'

import ChooseTokensSection from './ChooseTokensSection'
import PoolDescriptionSection from '../PoolTitleDescription'
import PoolTitleSection from '../PoolTitleSection'

export default function Step2() {
  const searchParams = useSearchParams()
  const pairType = searchParams.get('pairType') || PAIR_TYPES.LSD

  return (
    <div className='space-y-4 md:space-y-8'>
      <PoolTitleSection pairType={pairType} />

      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
        <ChooseTokensSection pairType={pairType} />
        <PoolDescriptionSection pairType={pairType} />
      </div>
    </div>
  )
}
