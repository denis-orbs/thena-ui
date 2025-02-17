import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import { OutlinedButton } from '@/components/buttons/Button'
import { PAIR_TYPES } from '@/constant'

import AddLiquidityClassicAndStablePool from './AddLiquidityClassicAndStablePool'
import AddLiquidityWeightedPool from './AddLiquidityWeightedPool'
import AddLiquidityClPool from './ClPool'

export default function Step2({ pool, setStep, isAdd, showSidebar = true }) {
  const searchParams = useSearchParams()
  const pairType = searchParams.get('pairType') ?? pool?.type
  const router = useRouter()

  return (
    <div className='flex flex-col gap-6 lg:flex-row lg:gap-8'>
      {pairType === PAIR_TYPES.WEIGHTED && <AddLiquidityWeightedPool pool={pool} setCurrentStep={setStep} />}

      {pairType === PAIR_TYPES.LSD && (
        <AddLiquidityClPool isAdd={isAdd} pool={pool} setCurrentStep={setStep} showSidebar={showSidebar} />
      )}

      {(pairType === PAIR_TYPES.CLASSIC || pairType === PAIR_TYPES.STABLE) && (
        <AddLiquidityClassicAndStablePool
          isAdd={isAdd}
          pool={pool}
          setCurrentStep={setStep}
          showSidebar={showSidebar}
        />
      )}

      <div className='mt-16'>
        <OutlinedButton onClick={() => router.back()}>Back</OutlinedButton>
        <OutlinedButton onClick={() => router.push('/pools')}>Cancel</OutlinedButton>
      </div>
    </div>
  )
}
