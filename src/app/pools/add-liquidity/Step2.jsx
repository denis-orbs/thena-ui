import React from 'react'

import { PAIR_TYPES } from '@/constant'

import AddLiquidityClassicAndStablePool from './AddLiquidityClassicAndStablePool'
import AddLiquidityClPool from './AddLiquidityClPool'
import AddLiquidityWeightedPool from './AddLiquidityWeightedPool'

export default function Step2({ pool, setCurrentStep, setIsAutomatic, isAdd, showSidebar = true }) {
  return (
    <div className='flex flex-col gap-6 lg:flex-row lg:gap-8'>
      {pool.type === PAIR_TYPES.WEIGHTED && (
        <AddLiquidityWeightedPool pool={pool} showSidebar={showSidebar} setCurrentStep={setCurrentStep} />
      )}

      {pool.type === PAIR_TYPES.LSD && (
        <AddLiquidityClPool
          isAdd={isAdd}
          pool={pool}
          setCurrentStep={setCurrentStep}
          setIsAutomatic={setIsAutomatic}
          showSidebar={showSidebar}
        />
      )}

      {(pool.type === PAIR_TYPES.CLASSIC || pool.type === PAIR_TYPES.STABLE) && (
        <AddLiquidityClassicAndStablePool
          isAdd={isAdd}
          pool={pool}
          setCurrentStep={setCurrentStep}
          showSidebar={showSidebar}
        />
      )}
    </div>
  )
}
