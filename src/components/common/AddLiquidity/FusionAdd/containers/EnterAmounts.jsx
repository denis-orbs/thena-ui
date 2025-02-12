import React, { useMemo } from 'react'

import { maxAmountSpend } from '@/lib/fusion'
import { Field } from '@/state/fusion/actions'
import { useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'

import { TokenAmountCard } from './TokenAmountCard'

export function EnterAmounts({ currencyA, currencyB, mintInfo }) {
  const { independentField, typedValue, liquidityRangeType } = useV3MintState()
  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers(mintInfo.noLiquidity)

  // get formatted amounts
  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [mintInfo.dependentField]: mintInfo.parsedAmounts[mintInfo.dependentField]?.toExact() ?? '',
    }),
    [independentField, mintInfo.dependentField, mintInfo.parsedAmounts, typedValue],
  )

  // get the max amounts user can add
  const maxAmounts = useMemo(
    () =>
      [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
        (accumulator, field) => ({
          ...accumulator,
          [field]: maxAmountSpend(mintInfo.currencyBalances[field]),
        }),
        {},
      ),
    [mintInfo],
  )

  return (
    <div className='flex flex-col gap-2 lg:flex-row'>
      <TokenAmountCard
        currency={currencyA}
        value={formattedAmounts[Field.CURRENCY_A]}
        handleInput={onFieldAInput}
        maxAmount={maxAmounts[Field.CURRENCY_A]}
        locked={mintInfo.depositADisabled}
        liquidityRangeType={liquidityRangeType}
        showPercent={false}
      />
      <TokenAmountCard
        currency={currencyB}
        value={formattedAmounts[Field.CURRENCY_B]}
        handleInput={onFieldBInput}
        maxAmount={maxAmounts[Field.CURRENCY_B]}
        locked={mintInfo.depositBDisabled}
        liquidityRangeType={liquidityRangeType}
        showPercent={false}
      />
    </div>
  )
}
