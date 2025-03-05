import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo } from 'react'

import Loading from '@/app/loading'
import { EmphasisButton, TextButton } from '@/components/buttons/Button'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import { usePairInfo } from '@/state/pools/hooks'

import AddLiquidityV1Pool from './AddLiquidityV1Pool'
import AddLiquidityWeightedPool from './AddLiquidityWeightedPool'
import AddLiquidityClPool from './ClPool'

export default function Step3({ setStep }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const updateSearchParams = useUpdateSearchParams()

  const poolAddress = searchParams.get('poolAddress')
  const pairTypeFromParams = searchParams.get('pairType')

  const { isLoading: isLoadingPairs } = usePairs()
  const pair = usePairInfo({ poolAddress, type: pairTypeFromParams })
  const pairType = useMemo(() => pair?.type ?? pairTypeFromParams, [pair, pairTypeFromParams])

  const handleBack = useCallback(() => {
    const routeHistoryLength = window?.history?.length ?? 0
    if (routeHistoryLength <= 1) {
      updateSearchParams({
        step: 2,
        firstAddress: pair?.token0?.address ?? null,
        secondAddress: pair?.token1?.address ?? null,
      })
    } else {
      router.back()
    }
  }, [pair, router, updateSearchParams])

  useEffect(() => {
    if (poolAddress) {
      updateSearchParams({ pairType: null })
    }
  }, [poolAddress, updateSearchParams])

  if (poolAddress && isLoadingPairs) {
    return <Loading />
  }

  return (
    <div className='space-y-10'>
      {pairType === PAIR_TYPES.WEIGHTED && (
        <AddLiquidityWeightedPool pool={pair} showSidebar setCurrentStep={setStep} />
      )}

      {pairType === PAIR_TYPES.LSD && <AddLiquidityClPool pool={pair} setCurrentStep={setStep} />}

      {(pairType === PAIR_TYPES.CLASSIC || pairType === PAIR_TYPES.STABLE) && <AddLiquidityV1Pool pair={pair} />}

      <div className='mt-16 flex gap-4'>
        <EmphasisButton onClick={handleBack}>Back</EmphasisButton>
        <TextButton onClick={() => router.push('/pools')}>Cancel</TextButton>
      </div>
    </div>
  )
}
