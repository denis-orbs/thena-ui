import React, { useMemo } from 'react'
import { BNB, Token, WBNB } from 'thena-sdk-core'

import { BNB_LOGO, UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { maxAmountSpend } from '@/lib/fusion'
import { Field } from '@/state/fusion/actions'
import { useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'

import { TokenAmountCard } from './TokenAmountCard'

export function EnterAmounts({
  currencyA,
  currencyB,
  setCurrencyA,
  setCurrencyB,
  mintInfo,
  position,
  isSmall,
  className,
  classNames,
}) {
  const { networkId } = useChainSettings()
  const assets = useAssets()
  const { independentField, typedValue, liquidityRangeType } = useV3MintState()
  const actions = useV3MintActionHandlers(mintInfo.noLiquidity)

  const onFieldAInput = useMemo(() => {
    if (position) {
      const isReversed =
        currencyA?.wrapped?.address?.toLowerCase() === position.quoteCurrency?.wrapped?.address?.toLowerCase() &&
        currencyB?.wrapped?.address?.toLowerCase() === position.baseCurrency?.wrapped?.address?.toLowerCase()

      return isReversed ? position.onFieldBInput : position.onFieldAInput
    }
    return actions.onFieldAInput
  }, [actions.onFieldAInput, position, currencyA, currencyB])

  const onFieldBInput = useMemo(() => {
    if (position) {
      const isReversed =
        currencyA?.wrapped?.address?.toLowerCase() === position.quoteCurrency?.wrapped?.address?.toLowerCase() &&
        currencyB?.wrapped?.address?.toLowerCase() === position.baseCurrency?.wrapped?.address?.toLowerCase()

      return isReversed ? position.onFieldAInput : position.onFieldBInput
    }
    return actions.onFieldBInput
  }, [actions.onFieldBInput, position, currencyA, currencyB])

  // get formatted amounts
  const formattedAmounts = useMemo(() => {
    if (position) {
      const isReversed =
        currencyA?.wrapped?.address?.toLowerCase() === position.quoteCurrency?.wrapped?.address?.toLowerCase() &&
        currencyB?.wrapped?.address?.toLowerCase() === position.baseCurrency?.wrapped?.address?.toLowerCase()

      if (isReversed) {
        return {
          [Field.CURRENCY_A]: position.formattedAmounts[Field.CURRENCY_B],
          [Field.CURRENCY_B]: position.formattedAmounts[Field.CURRENCY_A],
        }
      }
      return position.formattedAmounts
    }
    return {
      [independentField]: typedValue,
      [mintInfo.dependentField]: mintInfo.parsedAmounts[mintInfo.dependentField]?.toExact() ?? '',
    }
  }, [independentField, mintInfo.dependentField, mintInfo.parsedAmounts, position, typedValue, currencyA, currencyB])

  // get the max amounts user can add
  const maxAmounts = useMemo(() => {
    if (position) {
      const isReversed =
        currencyA?.wrapped?.address?.toLowerCase() === position.quoteCurrency?.wrapped?.address?.toLowerCase() &&
        currencyB?.wrapped?.address?.toLowerCase() === position.baseCurrency?.wrapped?.address?.toLowerCase()

      if (isReversed) {
        return {
          [Field.CURRENCY_A]: position.maxAmounts[Field.CURRENCY_B],
          [Field.CURRENCY_B]: position.maxAmounts[Field.CURRENCY_A],
        }
      }
      return position.maxAmounts
    }
    return [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
      (accumulator, field) => ({
        ...accumulator,
        [field]: maxAmountSpend(mintInfo.currencyBalances[field]),
      }),
      {},
    )
  }, [mintInfo.currencyBalances, position, currencyA, currencyB])

  const depositADisabled = useMemo(() => {
    if (position) {
      // Check if currencies are reversed compared to position
      const isReversed =
        currencyA?.wrapped?.address?.toLowerCase() === position.quoteCurrency?.wrapped?.address?.toLowerCase() &&
        currencyB?.wrapped?.address?.toLowerCase() === position.baseCurrency?.wrapped?.address?.toLowerCase()

      if (isReversed) {
        // Swap the disabled states when currencies are reversed
        return position.depositBDisabled
      }
      return position.depositADisabled
    }
    return mintInfo.depositADisabled
  }, [mintInfo.depositADisabled, position, currencyA, currencyB])

  const depositBDisabled = useMemo(() => {
    if (position) {
      const isReversed =
        currencyA?.wrapped?.address?.toLowerCase() === position.quoteCurrency?.wrapped?.address?.toLowerCase() &&
        currencyB?.wrapped?.address?.toLowerCase() === position.baseCurrency?.wrapped?.address?.toLowerCase()

      if (isReversed) {
        return position.depositADisabled
      }
      return position.depositBDisabled
    }
    return mintInfo.depositBDisabled
  }, [mintInfo.depositBDisabled, position, currencyA, currencyB])

  const assetsSelect = useMemo(
    () =>
      assets
        .filter(item => item.address === 'BNB' || item.address === WBNB[item.chainId]?.address?.toLowerCase())
        .map(item => {
          if (item.address === 'BNB') {
            const currency = BNB.onChain(networkId)
            currency.logoURI = BNB_LOGO
            currency.address = 'BNB'
            return currency
          }

          const token = new Token(networkId, item.address, item.decimals, item.symbol, item.name)
          token.logoURI = item.logoURI ?? UNKNOWN_LOGO
          return token
        }),
    [assets, networkId],
  )

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        {
          'xl:grid-cols-2': !depositADisabled && !depositBDisabled,
        },
        className,
      )}
    >
      <TokenAmountCard
        currency={currencyA}
        setCurrency={!position ? setCurrencyA : undefined}
        assetsSelect={assetsSelect}
        value={formattedAmounts?.[Field.CURRENCY_A]}
        handleInput={onFieldAInput}
        maxAmount={maxAmounts?.[Field.CURRENCY_A]}
        locked={depositADisabled}
        liquidityRangeType={liquidityRangeType}
        showPercent={false}
        showOutsideWarning={!position}
        isSmall={isSmall}
        classNames={{ input: 'xl:text-4 xl:leading-5', maxBtn: 'xl:font-medium', inputWrapper: classNames?.input }}
      />
      <TokenAmountCard
        currency={currencyB}
        setCurrency={!position ? setCurrencyB : undefined}
        assetsSelect={assetsSelect}
        value={formattedAmounts?.[Field.CURRENCY_B]}
        handleInput={onFieldBInput}
        maxAmount={maxAmounts?.[Field.CURRENCY_B]}
        locked={depositBDisabled}
        liquidityRangeType={liquidityRangeType}
        showPercent={false}
        showOutsideWarning={!position}
        isSmall={isSmall}
        classNames={{ input: 'xl:text-4 xl:leading-5', maxBtn: 'xl:font-medium', inputWrapper: classNames?.input }}
      />
    </div>
  )
}
