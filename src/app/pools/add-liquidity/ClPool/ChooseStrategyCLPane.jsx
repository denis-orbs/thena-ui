import { useSearchParams } from 'next/navigation'
import React from 'react'

import Box from '@/components/box'
import ChooseStrategy from '@/components/common/AddLiquidity/ChooseStrategy'
import { PAIR_TYPES } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { useV3MintState } from '@/state/fusion/hooks'

import AddLiquidityCLPane from './AddLiquidityCLPane'

export function ChooseStrategyCLPane({ pool, isAdd, isReverse }) {
  const { strategy } = useV3MintState()

  const searchParams = useSearchParams()
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address

  console.log({ firstAddress: searchParams.get('firstAddress'), secondAddress })

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  console.log({ firstAsset, secondAsset })

  return (
    <div className='flex flex-col gap-6 lg:flex-row lg:gap-8'>
      <Box className='w-full space-y-4 bg-transparent lg:space-y-6 lg:py-6'>
        <ChooseStrategy
          pairType={PAIR_TYPES.LSD}
          firstAsset={firstAsset}
          secondAsset={secondAsset}
          isReverse={isReverse}
          isAdd={isAdd}
        />
        <div className='w-full lg:w-[60%]'>{strategy && <AddLiquidityCLPane pool={pool} isAdd={isAdd} />}</div>
      </Box>
    </div>
  )
}
