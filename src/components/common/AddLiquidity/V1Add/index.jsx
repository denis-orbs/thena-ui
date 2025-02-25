'use client'

import React, { useMemo, useState } from 'react'

import Selection from '@/components/selection'
import { cn } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'

import { ManualPaneV1 } from './ManualPaneV1'
import { ZapperPane } from './ZapperPane'

export default function V1Add({ pool, pairType, firstAsset, secondAsset, setFirstAddress, setSecondAddress }) {
  const [isZapper, setIsZapper] = useState(false)
  const [slippage, setSlippage] = useState(0.5)

  const addSelections = useMemo(
    () => [
      {
        label: 'Pool Token Deposit',
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
      {
        label: 'Single Token Deposit',
        active: isZapper,
        onClickHandler: () => {
          setIsZapper(true)
        },
      },
    ],
    [isZapper],
  )

  return (
    <div className={cn('inline-flex w-full flex-col gap-4')}>
      {Boolean(pool) && <Selection data={addSelections} isFull isTranslation={false} />}

      <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} className='mb-0' />

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
