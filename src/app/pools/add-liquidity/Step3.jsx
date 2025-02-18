import { useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'

import { OutlinedButton } from '@/components/buttons/Button'
import { PAIR_TYPES } from '@/constant'
import { usePools } from '@/state/pools/hooks'

import AddLiquidityClassicAndStablePool from './AddLiquidityClassicAndStablePool'
import AddLiquidityWeightedPool from './AddLiquidityWeightedPool'
import AddLiquidityClPool from './ClPool'

export default function Step3({ setStep }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pools = usePools()
  const poolAddress = searchParams.get('poolAddress')
  // NOTE: Pool might be null if the pool address is not found
  const pool = useMemo(() => {
    if (poolAddress) {
      return pools.find(item => item.address === poolAddress)
    }

    return null
  }, [poolAddress, pools])
  const pairType = pool?.type ?? searchParams.get('pairType')

  return (
    <div className='space-y-10'>
      {pairType === PAIR_TYPES.WEIGHTED && (
        <AddLiquidityWeightedPool pool={pool} showSidebar setCurrentStep={setStep} />
      )}

      {pairType === PAIR_TYPES.LSD && <AddLiquidityClPool isAdd pool={pool} setCurrentStep={setStep} showSidebar />}

      {(pairType === PAIR_TYPES.CLASSIC || pairType === PAIR_TYPES.STABLE) && (
        <AddLiquidityClassicAndStablePool isAdd pool={pool} setCurrentStep={setStep} showSidebar />
      )}

      <div className='mt-16'>
        <OutlinedButton onClick={() => router.back()}>Back</OutlinedButton>
        <OutlinedButton onClick={() => router.push('/pools')}>Cancel</OutlinedButton>
      </div>
    </div>
  )
}
