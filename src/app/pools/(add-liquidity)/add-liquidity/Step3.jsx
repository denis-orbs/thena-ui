import { useSearchParams } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useEffect, useMemo } from 'react'

import Loading from '@/app/loading'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import { usePairInfo } from '@/state/pools/hooks'

import AddLiquidityV1Pool from './AddLiquidityV1Pool'
import AddLiquidityClPool from './ClPool'

export default function Step3() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const updateSearchParams = useUpdateSearchParams()

  const poolAddress = searchParams.get('poolAddress')
  const pairTypeFromParams = searchParams.get('pairType')
  const backParams = searchParams.get('back')

  const { isLoading: isLoadingPairs } = usePairs()
  const pair = usePairInfo({ poolAddress, type: pairTypeFromParams })
  const pairType = useMemo(() => pair?.type ?? pairTypeFromParams, [pair, pairTypeFromParams])

  const handleBack = useCallback(() => {
    if (Number(backParams) === 1) {
      router.push('/dashboard')
      return
    }

    router.push('/pools')
  }, [backParams, router])

  useEffect(() => {
    if (poolAddress) {
      updateSearchParams({ pairType: null })
    }
  }, [poolAddress, updateSearchParams])

  if (poolAddress && isLoadingPairs) {
    return <Loading />
  }

  return (
    <div>
      {pairType === PAIR_TYPES.LSD && <AddLiquidityClPool pool={pair} handleBack={handleBack} />}

      {(pairType === PAIR_TYPES.CLASSIC || pairType === PAIR_TYPES.STABLE) && (
        <AddLiquidityV1Pool pair={pair} handleBack={handleBack} />
      )}

      {/* <div className='mt-16 hidden gap-4 md:flex'>
        <EmphasisButton onClick={handleBack}>Back</EmphasisButton>
        <TextButton onClick={() => router.push('/pools')}>Cancel</TextButton>
      </div> */}
    </div>
  )
}
