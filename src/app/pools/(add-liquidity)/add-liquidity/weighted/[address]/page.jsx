'use client'

import React, { useMemo } from 'react'

import Loading from '@/app/loading'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useBackURL } from '@/hooks/useBackURL'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import AddLiquidityWeighted from '@/modules/WeightedPool/AddLiquidityWeighted'

function AddLiquidityWeightedPoolPage({ params }) {
  const { address } = params
  const { weightedPools, isLoading } = usePairs()
  const backUrl = useBackURL(PAIR_TYPES.WEIGHTED)

  const poolSelected = useMemo(
    () => (weightedPools || []).find(pool => pool.address === address),
    [address, weightedPools],
  )

  const { is2XlDown } = useMediaQuery()

  if (isLoading) return <Loading />

  return (
    <LayoutWithBackButton
      hiddenBackButton={is2XlDown}
      className='mx-auto max-lg:mx-4 lg:mx-[40px] xl:!mt-6 xl:!w-[1184px] 2xl:!mt-8 2xl:!w-[1312px] 3xl:!mt-16 3xl:!w-[1440px]'
      backUrl={backUrl}
    >
      <AddLiquidityWeighted pool={poolSelected} />
    </LayoutWithBackButton>
  )
}

export default AddLiquidityWeightedPoolPage
