'use client'

import React, { useMemo } from 'react'

import Loading from '@/app/loading'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useBackURL } from '@/hooks/useBackURL'
import AddLiquidityWeighted from '@/modules/WeightedPool/AddLiquidityWeighted'

function AddLiquidityWeightedPoolPage({ params }) {
  const { address } = params
  const { weightedPools, isLoading } = usePairs()
  const backUrl = useBackURL(PAIR_TYPES.WEIGHTED)

  const poolSelected = useMemo(
    () => (weightedPools || []).find(pool => pool.address === address),
    [address, weightedPools],
  )

  if (isLoading) return <Loading />

  return (
    <LayoutWithBackButton backUrl={backUrl}>
      <AddLiquidityWeighted pool={poolSelected} />
    </LayoutWithBackButton>
  )
}

export default AddLiquidityWeightedPoolPage
