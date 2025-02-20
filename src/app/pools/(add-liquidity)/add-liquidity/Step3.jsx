import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'

import Loading from '@/app/loading'
import { EmphasisButton, TextButton } from '@/components/buttons/Button'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'

import AddLiquidityV1Pool from './AddLiquidityV1Pool'
import AddLiquidityWeightedPool from './AddLiquidityWeightedPool'
import AddLiquidityClPool from './ClPool'

export default function Step3({ setStep }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const updateSearchParams = useUpdateSearchParams()
  const { pairs, isLoading: isLoadingPairs } = usePairs()

  const poolAddress = searchParams.get('poolAddress')

  useEffect(() => {
    if (poolAddress) {
      updateSearchParams({ pairType: null })
    }
  }, [poolAddress, updateSearchParams])

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

      {pairType === PAIR_TYPES.LSD && <AddLiquidityClPool pool={pair} setCurrentStep={setStep} showSidebar />}

      {(pairType === PAIR_TYPES.CLASSIC || pairType === PAIR_TYPES.STABLE) && <AddLiquidityV1Pool pair={pair} />}

      <div className='mt-16 flex gap-4'>
        <EmphasisButton onClick={() => router.back()}>Back</EmphasisButton>
        <TextButton onClick={() => router.push('/pools')}>Cancel</TextButton>
      </div>
    </div>
  )
}
