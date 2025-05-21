import React, { useEffect, useMemo, useState } from 'react'
import { BNB, Token, WBNB } from 'thena-sdk-core'

import { UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { maxAmountSpend } from '@/lib/fusion'
import { cn, isInvalidAmount } from '@/lib/utils'
import { Field } from '@/state/fusion/actions'
import { useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import { TokenAmountCard } from './TokenAmountCard'

export function EnterAmounts({
  currencyA,
  currencyB,
  setCurrencyA,
  setCurrencyB,
  mintInfo,
  position,
  isSmall,
  checkIsInvalid = false,
}) {
  const { networkId } = useChainSettings()
  const assets = useAssets()
  const { independentField, typedValue, liquidityRangeType } = useV3MintState()
  const actions = useV3MintActionHandlers(mintInfo.noLiquidity)

  const [errorA, setErrorA] = useState(false)
  const [errorB, setErrorB] = useState(false)

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

  const assetsSelect = useMemo(
    () =>
      assets
        .filter(item => item.address === 'BNB' || item.address === WBNB[item.chainId]?.address?.toLowerCase())
        .map(item => {
          if (item.address === 'BNB') {
            const currency = BNB.onChain(networkId)
            currency.logoURI = 'https://cdn.thena.fi/assets/WBNB.png'
            currency.address = 'BNB'
            return currency
          }

          const token = new Token(networkId, item.address, item.decimals, item.symbol, item.name)
          token.logoURI = item.logoURI ?? UNKNOWN_LOGO
          return token
        }),
    [assets, networkId],
  )

  useEffect(() => {
    if (
      checkIsInvalid &&
      (isInvalidAmount(formattedAmounts[Field.CURRENCY_A]) ||
        Number(formattedAmounts[Field.CURRENCY_A]) > Number(maxAmounts[Field.CURRENCY_A].toExact()))
    ) {
      setErrorA(true)
    } else {
      setErrorA(false)
    }

    if (
      checkIsInvalid &&
      (isInvalidAmount(formattedAmounts[Field.CURRENCY_B]) ||
        Number(formattedAmounts[Field.CURRENCY_B]) > Number(maxAmounts[Field.CURRENCY_B].toExact()))
    ) {
      setErrorB(true)
    } else {
      setErrorB(false)
    }
  }, [checkIsInvalid, formattedAmounts, maxAmounts])
  return (
    <div
      className={cn('grid grid-cols-1 gap-4', {
        'xl:grid-cols-2': !depositADisabled && !depositBDisabled,
      })}
    >
      <TokenAmountCard
        currency={currencyA}
        setCurrency={setCurrencyA}
        assetsSelect={assetsSelect}
        value={formattedAmounts[Field.CURRENCY_A]}
        handleInput={onFieldAInput}
        maxAmount={maxAmounts[Field.CURRENCY_A]}
        locked={depositADisabled}
        liquidityRangeType={liquidityRangeType}
        showPercent={false}
        showOutsideWarning={!position}
        isSmall={isSmall}
        isInvalidAmount={errorA}
      />
      <TokenAmountCard
        currency={currencyB}
        setCurrency={setCurrencyB}
        assetsSelect={assetsSelect}
        value={formattedAmounts[Field.CURRENCY_B]}
        handleInput={onFieldBInput}
        maxAmount={maxAmounts[Field.CURRENCY_B]}
        locked={depositBDisabled}
        liquidityRangeType={liquidityRangeType}
        showPercent={false}
        showOutsideWarning={!position}
        isSmall={isSmall}
        isInvalidAmount={errorB}
      />
    </div>
  )
}
