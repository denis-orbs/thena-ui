'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { Position } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'

import { GreenBadge, PrimaryBadge } from '@/components/badges/Badge'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import { TokenAmountCard } from '@/components/common/AddLiquidity/FusionAdd/containers/TokenAmountCard'
import IconGroup from '@/components/icongroup'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { FusionRangeType } from '@/constant'
import { useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraIncrease } from '@/hooks/fusion/useAlgebra'
import { useCurrencyBalances } from '@/hooks/fusion/useCurrencyBalances'
import { maxAmountSpend, tryParseAmount, unwrappedToken } from '@/lib/fusion'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { warnToast } from '@/lib/notify'
import { unwrappedSymbol } from '@/lib/utils'
import { Bound, Field } from '@/state/fusion/actions'
import { useSettings } from '@/state/settings/hooks'

export default function AddManualModal({
  popup,
  setPopup,
  pool,
  position,
  mutateManual,
  outOfRange,
  _fusion,
  tickAtLimit,
}) {
  const [typedValue, setTypedValue] = useState('')
  const [independentField, setIndependentField] = useState(Field.CURRENCY_A)
  const { asset0, asset1, tickLower, tickUpper, tokenId } = pool
  const { slippage, deadline } = useSettings()
  const t = useTranslations()

  const tokenA = useToken(asset0.address)
  const tokenB = useToken(asset1.address)

  const currencyA = tokenA ? unwrappedToken(tokenA) : undefined
  const currencyB = tokenB ? unwrappedToken(tokenB) : undefined
  const currencies = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA,
      [Field.CURRENCY_B]: currencyB,
    }),
    [currencyA, currencyB],
  )
  const balances = useCurrencyBalances([currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]])

  const currencyBalances = useMemo(
    () => ({
      [Field.CURRENCY_A]: balances[0],
      [Field.CURRENCY_B]: balances[1],
    }),
    [balances],
  )

  const independentCurrency = useMemo(() => currencies[independentField], [currencies, independentField])

  const independentAmount = useMemo(
    () => tryParseAmount(typedValue, independentCurrency),
    [typedValue, independentCurrency],
  )

  const dependentAmount = useMemo(() => {
    // we wrap the currencies just to get the price in terms of the other token
    const wrappedIndependentAmount = independentAmount?.wrapped
    const dependentCurrency = independentField === Field.CURRENCY_A ? currencyB : currencyA
    if (
      independentAmount &&
      wrappedIndependentAmount &&
      typeof tickLower === 'number' &&
      typeof tickUpper === 'number'
    ) {
      const pos = wrappedIndependentAmount.currency.equals(_fusion.token0)
        ? Position.fromAmount0({
            pool: _fusion,
            tickLower,
            tickUpper,
            amount0: independentAmount.quotient,
            useFullPrecision: true, // we want full precision for the theoretical position
          })
        : Position.fromAmount1({
            pool: _fusion,
            tickLower,
            tickUpper,
            amount1: independentAmount.quotient,
          })

      const dependentTokenAmount = wrappedIndependentAmount.currency.equals(_fusion.token0) ? pos.amount1 : pos.amount0
      return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
    }

    return undefined
  }, [independentAmount, _fusion, currencyB, currencyA, tickLower, tickUpper, independentField])

  const parsedAmounts = useMemo(
    () => ({
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    }),
    [dependentAmount, independentAmount, independentField],
  )

  const pos = useMemo(() => {
    if (!_fusion || !tokenA || !tokenB || typeof tickLower !== 'number' || typeof tickUpper !== 'number') {
      return undefined
    }

    // mark as 0 if disabled because out of range
    const amount0 = parsedAmounts?.[tokenA.equals(_fusion.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]?.quotient
    const amount1 = parsedAmounts?.[tokenA.equals(_fusion.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]?.quotient

    if (amount0 !== undefined && amount1 !== undefined) {
      return Position.fromAmounts({
        pool: _fusion,
        tickLower,
        tickUpper,
        amount0,
        amount1,
        useFullPrecision: true, // we want full precision for the theoretical position
      })
    }
    return undefined
  }, [parsedAmounts, _fusion, tokenA, tokenB, tickLower, tickUpper])

  const { onAlgebraIncrease, pending } = useAlgebraIncrease()

  const depositADisabled = useMemo(() => position && position.pool.tickCurrent > position.tickUpper, [position])
  const depositBDisabled = useMemo(() => position && position.pool.tickCurrent < position.tickLower, [position])

  // get formatted amounts
  const formattedAmounts = useMemo(() => {
    const dependentField = Field.CURRENCY_A === independentField ? Field.CURRENCY_B : Field.CURRENCY_A
    return {
      [independentField]: typedValue,
      [dependentField]: parsedAmounts[dependentField]?.toExact() ?? '',
    }
  }, [typedValue, independentField, parsedAmounts])

  const maxAmounts = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => ({
      ...accumulator,
      [field]: maxAmountSpend(currencyBalances[field]),
    }),
    {},
  )

  const onFieldAInput = useCallback(
    val => {
      setIndependentField(Field.CURRENCY_A)
      setTypedValue(val)
    },
    [setTypedValue, setIndependentField],
  )

  const onFieldBInput = useCallback(
    val => {
      setIndependentField(Field.CURRENCY_B)
      setTypedValue(val)
    },
    [setTypedValue, setIndependentField],
  )

  const errorMessage = useMemo(() => {
    if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
      return 'Invalid Amount'
    }

    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

    if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
      return `Insufficient ${currencies[Field.CURRENCY_A]?.symbol} balance`
    }

    if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
      return `Insufficient ${currencies[Field.CURRENCY_B]?.symbol} balance`
    }
    return null
  }, [parsedAmounts, currencyBalances, currencies])

  const onAddLiquidity = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }
    const amountA = parsedAmounts[Field.CURRENCY_A]
    const amountB = parsedAmounts[Field.CURRENCY_B]
    onAlgebraIncrease(amountA, amountB, pos, depositADisabled, depositBDisabled, slippage, deadline, tokenId, () => {
      mutateManual()
      setPopup(false)
      setTypedValue('')
    })
  }, [
    errorMessage,
    parsedAmounts,
    pos,
    depositADisabled,
    depositBDisabled,
    slippage,
    deadline,
    tokenId,
    mutateManual,
    onAlgebraIncrease,
    setPopup,
  ])

  return (
    <Modal
      isOpen={popup}
      title='Add Liquidity'
      closeModal={() => {
        setPopup(false)
      }}
    >
      <ModalBody>
        <div className='flex items-center justify-between rounded-lg bg-neutral-800 p-3'>
          <div className='flex items-center gap-3'>
            <IconGroup
              className='-space-x-2'
              classNames={{ image: 'w-8 h-8 outline-2' }}
              logo1={pool.asset0.logoURI}
              logo2={pool.asset1.logoURI}
            />
            <div className='flex flex-col gap-1'>
              <TextHeading>
                {unwrappedSymbol(pool.asset0)}/{unwrappedSymbol(pool.asset1)}
              </TextHeading>
              <Paragraph className='text-xs'>
                #{pool.tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
              </Paragraph>
            </div>
          </div>
          {outOfRange ? <PrimaryBadge>{t('Out of Range')}</PrimaryBadge> : <GreenBadge>{t('In Range')}</GreenBadge>}
        </div>
        <div className='flex flex-col gap-3'>
          <Paragraph className='text-sm'>{t('Selected Range')}</Paragraph>
          <div className='grid grid-cols-2 gap-4'>
            <div className='flex flex-col items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2'>
              <TextSubHeading className='text-xs'>{t('Min Price')}</TextSubHeading>
              <TextHeading>{formatTickPrice(position?.token0PriceLower, tickAtLimit, Bound.LOWER)}</TextHeading>
              <Paragraph className='text-[10px]'>
                {t('[symbolA] per [symbolB]', {
                  symbolA: unwrappedSymbol(asset1),
                  symbolB: unwrappedSymbol(asset0),
                })}
              </Paragraph>
            </div>
            <div className='flex flex-col items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2'>
              <TextSubHeading className='text-xs'>{t('Max Price')}</TextSubHeading>
              <TextHeading>{formatTickPrice(position?.token0PriceUpper, tickAtLimit, Bound.UPPER)}</TextHeading>
              <Paragraph className='text-[10px]'>
                {t('[symbolA] per [symbolB]', {
                  symbolA: unwrappedSymbol(asset1),
                  symbolB: unwrappedSymbol(asset0),
                })}
              </Paragraph>
            </div>
          </div>
          <div className='flex flex-col items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2'>
            <TextSubHeading className='text-xs'>{t('Current Price')}</TextSubHeading>
            <TextHeading>{_fusion?.token0Price.toSignificant(6)}</TextHeading>
            <Paragraph className='text-[10px]'>
              {t('[symbolA] per [symbolB]', {
                symbolA: unwrappedSymbol(asset1),
                symbolB: unwrappedSymbol(asset0),
              })}
            </Paragraph>
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <TokenAmountCard
            currency={currencyA}
            value={formattedAmounts[Field.CURRENCY_A]}
            handleInput={onFieldAInput}
            maxAmount={maxAmounts[Field.CURRENCY_A]}
            liquidityRangeType={FusionRangeType.MANUAL_RANGE}
            locked={depositADisabled}
            title={`${t('Asset')} 1`}
          />
          <TokenAmountCard
            currency={currencyB}
            value={formattedAmounts[Field.CURRENCY_B]}
            handleInput={onFieldBInput}
            maxAmount={maxAmounts[Field.CURRENCY_B]}
            liquidityRangeType={FusionRangeType.MANUAL_RANGE}
            locked={depositBDisabled}
            title={`${t('Asset')} 2`}
          />
        </div>
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <TextButton className='w-full' onClick={() => setPopup(false)}>
          {t('Cancel')}
        </TextButton>
        <PrimaryButton className='w-full' disabled={pending} onClick={() => onAddLiquidity()}>
          {t('Add')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}
