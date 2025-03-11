'use client'

import React, { useMemo } from 'react'

import Loading from '@/app/loading'
import { usePairs } from '@/context/pairsContext'
import AddLiquidityWeighted from '@/modules/WeightedPool/AddLiquidityWeighted'

function AddLiquidityWeightedPoolPage({ params }) {
  const { address } = params
  const { weightedPools, isLoading } = usePairs()

  const poolSelected = useMemo(
    () => (weightedPools || []).find(pool => pool.address === address),
    [address, weightedPools],
  )

  if (isLoading) return <Loading />
  return <AddLiquidityWeighted pool={poolSelected} />
}

export default AddLiquidityWeightedPoolPage
