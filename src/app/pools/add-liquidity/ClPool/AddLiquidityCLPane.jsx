import { useSearchParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import ManualAdd from '@/components/common/AddLiquidity/FusionAdd/ManualAdd'
import KyberZapperPane from '@/components/common/AddLiquidity/FusionAdd/ZapperPane'
import Selection from '@/components/selection'
import { useFusionPairs } from '@/context/fusionsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { cn } from '@/lib/utils'
import SettingSlippageModal from '@/modules/Position/SettingSlippageModal'
import { useV3DerivedMintInfo, useV3MintState } from '@/state/fusion/hooks'

const feeAmount = 3000
export default function AddLiquidityCLPane({ pool, isAdd, isReverse }) {
  const { strategy } = useV3MintState()

  const [isZapper, setIsZapper] = useState(false)
  const [slippage, setSlippage] = useState(0.5)

  const searchParams = useSearchParams()
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address

  const fusionPairs = useFusionPairs()

  const currencyA = useCurrency(firstAddress)
  const currencyB = useCurrency(secondAddress)
  const baseCurrency = useMemo(() => (isReverse ? currencyB : currencyA), [isReverse, currencyA, currencyB])
  const quoteCurrency = useMemo(() => (isReverse ? currencyA : currencyB), [isReverse, currencyA, currencyB])
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)

  const pair = useMemo(() => {
    if (!pool) return
    const result = (fusionPairs ?? []).find(ele => pool?.address?.toLowerCase() === ele?.address)
    return {
      ...pool,
      currentTick: Number(result?.globalState.tick || 0),
    }
  }, [pool, fusionPairs])

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
    <div className='flex w-full flex-col gap-6 lg:flex-row lg:gap-8'>
      <div className='w-full flex-[6] flex-col bg-transparent'>
        <div className={cn('flex justify-end', strategy?.isAutomatic && 'hidden')}>
          <SettingSlippageModal slippage={slippage} updateSlippage={setSlippage} />
        </div>

        {strategy?.isAutomatic ? (
          <FusionAdd strategy={isAdd ? pair : strategy} isAdd={isAdd} />
        ) : (
          <div className='space-y-6'>
            <Selection className='w-full' data={addSelections} isFull isTranslation={false} />
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
