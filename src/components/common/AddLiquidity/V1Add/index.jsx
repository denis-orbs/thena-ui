'use client'

import React, { useMemo, useState } from 'react'

import Selection from '@/components/selection'
import { cn } from '@/lib/utils'
import SettingSlippageModal from '@/modules/Position/SettingSlippageModal'

import { ManualPaneV1 } from './ManualPane'
import { ZapperPane } from './ZapperPane'

export default function V1Add({ pool, pairType, firstAsset, secondAsset, setFirstAddress, setSecondAddress }) {
  const [isZapper, setIsZapper] = useState(false)
  const [slippage, setSlippage] = useState(0.5)

  const addSelections = useMemo(() => {
    const selections = [
      {
        label: 'Pool Token Deposit',
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
    ]

    if (pool) {
      selections.push({
        label: 'Single Token Deposit',
        active: isZapper,
        onClickHandler: () => {
          setIsZapper(true)
        },
      })
    }

    return selections
  }, [isZapper, pool])

  return (
    <div className={cn('inline-flex w-full flex-col gap-5')}>
      <Selection data={addSelections} isFull isTranslation={false} />

      <div className='flex justify-end'>
        <SettingSlippageModal slippage={slippage} updateSlippage={setSlippage} />
      </div>

      {isZapper ? (
        <ZapperPane asset0={firstAsset} asset1={secondAsset} slippage={slippage} strategy={pool} />
      ) : (
        <ManualPaneV1
          strategy={pool}
          pairType={pairType}
          firstAsset={firstAsset}
          secondAsset={secondAsset}
          slippage={slippage}
          setFirstAddress={setFirstAddress}
          setSecondAddress={setSecondAddress}
        />
      )}
    </div>
  )
}
