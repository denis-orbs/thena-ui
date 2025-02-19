import { useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'

import Loading from '@/app/loading'
import { OutlinedButton } from '@/components/buttons/Button'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'

import AddLiquidityV1Pool from './AddLiquidityV1Pool'
import AddLiquidityWeightedPool from './AddLiquidityWeightedPool'
import AddLiquidityClPool from './ClPool'

export default function Step3({ setStep }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { pairs, isLoading: isLoadingPairs } = usePairs()
  const poolAddress = searchParams.get('poolAddress')

  // NOTE: Pair might be null if the pool address is not found
  const pair = useMemo(() => {
    if (poolAddress || !isLoadingPairs) {
      return pairs.find(item => item.address === poolAddress)
    }

    return null
  }, [poolAddress, pairs, isLoadingPairs])
  const pairType = pair?.type ?? searchParams.get('pairType')

  if (poolAddress && isLoadingPairs) {
    return <Loading />
  }

  return (
    <div className='space-y-10'>
      {pairType === PAIR_TYPES.WEIGHTED && (
        <AddLiquidityWeightedPool pool={pair} showSidebar setCurrentStep={setStep} />
      )}

      {pairType === PAIR_TYPES.LSD && <AddLiquidityClPool isAdd pool={pair} setCurrentStep={setStep} showSidebar />}

      {(pairType === PAIR_TYPES.CLASSIC || pairType === PAIR_TYPES.STABLE) && <AddLiquidityV1Pool pair={pair} />}

      <div className='mt-16'>
        <OutlinedButton onClick={() => router.back()}>Back</OutlinedButton>
        <OutlinedButton onClick={() => router.push('/pools')}>Cancel</OutlinedButton>
      </div>
    </div>
  )
}
