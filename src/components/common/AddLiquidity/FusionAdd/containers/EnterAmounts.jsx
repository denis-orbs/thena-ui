import React, { useMemo } from 'react'

import { maxAmountSpend } from '@/lib/fusion'
import { cn } from '@/lib/utils'
import { Field } from '@/state/fusion/actions'
import { useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'

import { TokenAmountCard } from './TokenAmountCard'

export function EnterAmounts({ currencyA, currencyB, mintInfo, position }) {
  const { independentField, typedValue, liquidityRangeType } = useV3MintState()
  const actions = useV3MintActionHandlers(mintInfo.noLiquidity)

  const onFieldAInput = useMemo(
    () => (position ? position.onFieldAInput : actions.onFieldAInput),
    [actions.onFieldAInput, position],
  )

  const onFieldBInput = useMemo(
    () => (position ? position.onFieldBInput : actions.onFieldBInput),
    [actions.onFieldBInput, position],
  )

  // get formatted amounts
  const formattedAmounts = useMemo(
    () =>
      position
        ? position.formattedAmounts
        : {
            [independentField]: typedValue,
            [mintInfo.dependentField]: mintInfo.parsedAmounts[mintInfo.dependentField]?.toExact() ?? '',
          },
    [independentField, mintInfo.dependentField, mintInfo.parsedAmounts, position, typedValue],
  )

  // get the max amounts user can add
  const maxAmounts = useMemo(
    () =>
      position
        ? position?.maxAmounts
        : [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
            (accumulator, field) => ({
              ...accumulator,
              [field]: maxAmountSpend(mintInfo.currencyBalances[field]),
            }),
            {},
          ),
    [mintInfo.currencyBalances, position],
  )

  const depositADisabled = useMemo(
    () => (position ? position.depositADisabled : mintInfo.depositADisabled),
    [mintInfo.depositADisabled, position],
  )

  const depositBDisabled = useMemo(
    () => (position ? position.depositBDisabled : mintInfo.depositBDisabled),
    [mintInfo.depositBDisabled, position],
  )

  return (
    <div
      className={cn('flex flex-col gap-2', {
        'lg:flex-row': !depositADisabled && !depositBDisabled,
      })}
    >
      <TokenAmountCard
        currency={currencyA}
        value={formattedAmounts[Field.CURRENCY_A]}
        handleInput={onFieldAInput}
        maxAmount={maxAmounts[Field.CURRENCY_A]}
        locked={depositADisabled}
        liquidityRangeType={liquidityRangeType}
        showPercent={false}
        showOutsideWarning={!position}
      />
      <TokenAmountCard
        currency={currencyB}
        value={formattedAmounts[Field.CURRENCY_B]}
        handleInput={onFieldBInput}
        maxAmount={maxAmounts[Field.CURRENCY_B]}
        locked={depositBDisabled}
        liquidityRangeType={liquidityRangeType}
        showPercent={false}
        showOutsideWarning={!position}
      />
    </div>
  )
}
