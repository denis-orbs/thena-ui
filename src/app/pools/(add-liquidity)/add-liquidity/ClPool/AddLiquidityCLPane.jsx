import React, { useMemo, useState } from 'react'

import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import ManualAdd from '@/components/common/AddLiquidity/FusionAdd/ManualAdd'
import KyberZapperPane from '@/components/common/AddLiquidity/FusionAdd/ZapperPane'
import Selection from '@/components/selection'
import { cn } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'
import { useV3MintState } from '@/state/fusion/hooks'

export default function AddLiquidityCLPane({ mintInfo, baseCurrency, quoteCurrency }) {
  const { strategy } = useV3MintState()

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

  if (!strategy) return <div />
  return (
    <div className='flex w-full flex-col gap-6 lg:flex-row lg:gap-8'>
      <div className='w-full flex-[6] flex-col bg-transparent'>
        {strategy?.isAutomatic ? (
          <FusionAdd strategy={strategy} />
        ) : (
          <div className='space-y-4'>
            {!mintInfo?.noLiquidity && (
              <Selection className={cn('w-full')} data={addSelections} isFull isTranslation={false} />
            )}
            <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} />

            {isZapper ? (
              <KyberZapperPane
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                slippage={slippage}
                mintInfo={mintInfo}
                strategy={strategy}
              />
            ) : (
              <ManualAdd
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                mintInfo={mintInfo}
                slippage={slippage}
                strategy={strategy}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
