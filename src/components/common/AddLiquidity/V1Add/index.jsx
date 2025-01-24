'use client'

import React, { useMemo, useState } from 'react'

import Selection from '@/components/selection'
import { cn, wrappedAddress } from '@/lib/utils'
import PoolTitle from '@/modules/PoolTitle'
import SettingSlippageModal from '@/modules/Position/SettingSlippageModal'
import { usePools } from '@/state/pools/hooks'

import { ManualPaneV1 } from './ManualPane'
import { ZapperPaneV1 } from './ZapperPane'

export default function V1Add({
  pairType,
  isModal,
  isAdd,
  firstAsset,
  setFirstAddress,
  secondAsset,
  setSecondAddress,
  setFirstAmountValue,
  setSecondAmountValue,
  slippage,
  setSlippage,
}) {
  const [isZapper, setIsZapper] = useState(false)
  const pools = usePools()

  const pool = useMemo(() => {
    const mappedPool = pools.reduce((acc, p) => {
      if (
        [p.token0?.address, p.token1?.address].includes(wrappedAddress(firstAsset)) &&
        [p.token0?.address, p.token1?.address].includes(wrappedAddress(secondAsset)) &&
        pairType === p.type
      ) {
        acc[p.version] = p
      }
      return acc
    }, {})

    return mappedPool[3] || mappedPool[2]
  }, [pools, firstAsset, secondAsset, pairType])

  const addSelections = useMemo(
    () => [
      {
        label: 'Default',
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
      {
        label: 'Zapper',
        active: isZapper,
        onClickHandler: () => {
          setIsZapper(true)
        },
      },
    ],
    [isZapper],
  )

  return (
    <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
      {isAdd && pool && <PoolTitle strategy={pool} />}
      <Selection data={addSelections} isFull isTranslation={false} />

      <div className='flex justify-end'>
        <SettingSlippageModal slippage={slippage} updateSlippage={setSlippage} />
      </div>

      {isZapper ? (
        <ZapperPaneV1 asset0={firstAsset} asset1={secondAsset} slippage={slippage} strategy={pool} />
      ) : (
        <ManualPaneV1
          isModal
          strategy={pool}
          pairType={pairType}
          firstAsset={firstAsset}
          setFirstAddress={setFirstAddress}
          secondAsset={secondAsset}
          setSecondAddress={setSecondAddress}
          setFirstAmountValue={setFirstAmountValue}
          setSecondAmountValue={setSecondAmountValue}
          slippage={slippage}
          setSlippage={setSlippage}
        />
      )}
    </div>
  )
}
