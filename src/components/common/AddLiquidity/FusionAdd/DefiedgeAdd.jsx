'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { JSBI, WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Spinner from '@/components/spinner'
import { FusionRangeType } from '@/constant'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useCurrencyBalance } from '@/hooks/fusion/useCurrencyBalances'
import { useDefiedgeAdd, useDefiedgeAddAndStake } from '@/hooks/fusion/useDefiedge'
import useWallet from '@/hooks/useWallet'
import { readCall, simulateCall } from '@/lib/contractActions'
import { getDefiedgeStrategyContract } from '@/lib/contracts'
import { maxAmountSpend, tryParseAmount } from '@/lib/fusion'
import { warnToast } from '@/lib/notify'
import { cn, fromWei } from '@/lib/utils'
import PoolTitle from '@/modules/PoolTitle'
import { Field } from '@/state/fusion/actions'
import { useV3DerivedMintInfo } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import { EnterAmounts } from './containers/EnterAmounts'
import { TokenAmountCard } from './containers/TokenAmountCard'

const feeAmount = 3000

export const fetchDefiedgeInfo = async (chainId, strategy) => {
  const contract = getDefiedgeStrategyContract(strategy.address, chainId)
  const factory = await readCall(contract, 'factory', [], chainId)
  const isTwap = factory.toLowerCase() === '0x657761b0040ea03ce668c3a392da6a1751c43331'
  let token0Price = 0
  let token1Price = 0
  if (isTwap) {
    const aumWithFees = await simulateCall(contract, 'getAUMWithFees', [false], chainId)

    const amount0 = fromWei(aumWithFees[0], strategy.token0.decimals)
    const amount1 = fromWei(aumWithFees[1], strategy.token1.decimals)

    if (!!amount0 && !!amount1) {
      token0Price = amount0.div(amount1).toNumber()
      token1Price = amount1.div(amount0).toNumber()
    }
  }
  return {
    type: strategy.title,
    title: strategy.title,
    address: strategy.address,
    isTwap,
    token0Price,
    token1Price,
  }
}

export default function DefiedgeAdd({ strategy, isModal, isAdd }) {
  const [independentField, setIndependentField] = useState(null)
  const [typedValue, setTypedValue] = useState(null)
  const baseCurrency = useCurrency(strategy.token0.address)
  const quoteCurrency = useCurrency(strategy.token1.address)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)
  const { errorMessage, currencyBalances } = mintInfo
  const { data: preset } = useSWR(
    strategy && ['defiedge/info', strategy.address],
    () => fetchDefiedgeInfo(networkId, strategy),
    {
      refreshInterval: 0,
    },
  )
  const wbnbBalance = useCurrencyBalance(WBNB[networkId])
  const { onDefiedgeAdd, pending } = useDefiedgeAdd()
  const { onDefiedgeAddAndStake, pendingStake } = useDefiedgeAddAndStake()
  const t = useTranslations()

  const onFieldAInput = useCallback(
    val => {
      setIndependentField(Field.CURRENCY_A)
      setTypedValue(val)
    },
    [setIndependentField, setTypedValue],
  )

  const onFieldBInput = useCallback(
    val => {
      setIndependentField(Field.CURRENCY_B)
      setTypedValue(val)
    },
    [setIndependentField, setTypedValue],
  )

  // get formatted amounts
  const formattedAmounts = useMemo(() => {
    const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A
    if (!preset) {
      return {
        [independentField]: '',
        [dependentField]: '',
      }
    }
    const dependentPrice =
      (independentField === Field.CURRENCY_A ? preset.token1Price : preset.token0Price) * typedValue
    return {
      [independentField]: typedValue,
      [dependentField]: dependentPrice?.toString() ?? '',
    }
  }, [preset, independentField, typedValue])

  const amountA = useMemo(
    () =>
      !preset
        ? ''
        : preset.isTwap
          ? tryParseAmount(formattedAmounts[Field.CURRENCY_A], baseCurrency)
          : mintInfo.parsedAmounts[Field.CURRENCY_A],
    [mintInfo, preset, baseCurrency, formattedAmounts],
  )
  const amountB = useMemo(
    () =>
      !preset
        ? ''
        : preset.isTwap
          ? tryParseAmount(formattedAmounts[Field.CURRENCY_B], quoteCurrency)
          : mintInfo.parsedAmounts[Field.CURRENCY_B],
    [mintInfo, preset, quoteCurrency, formattedAmounts],
  )

  const amountToWrap = useMemo(() => {
    if (!baseCurrency || !quoteCurrency || !amountA || !amountB) return
    if (baseCurrency.isNative || baseCurrency.wrapped.address.toLowerCase() === WBNB[networkId].address.toLowerCase()) {
      if (wbnbBalance && JSBI.greaterThan(amountA.numerator, wbnbBalance.numerator)) {
        return JSBI.subtract(amountA.numerator, wbnbBalance.numerator)
      }
    } else if (
      quoteCurrency.isNative ||
      quoteCurrency.wrapped.address.toLowerCase() === WBNB[networkId].address.toLowerCase()
    ) {
      if (wbnbBalance && JSBI.greaterThan(amountB.numerator, wbnbBalance.numerator)) {
        return JSBI.subtract(amountB.numerator, wbnbBalance.numerator)
      }
    }
  }, [amountA, amountB, baseCurrency, quoteCurrency, wbnbBalance, networkId])

  const errMessage = useMemo(() => {
    if (!preset || !preset.isTwap) return errorMessage

    if (!amountA || !amountB) {
      return 'Invalid Amount'
    }

    if (amountA && currencyBalances?.[Field.CURRENCY_A]?.lessThan(amountA)) {
      console.log('currencyBalances?.[Field.CURRENCY_A] :>> ', currencyBalances?.[Field.CURRENCY_A].toExact())
      return 'Insufficient Balance'
    }

    if (amountB && currencyBalances?.[Field.CURRENCY_B]?.lessThan(amountB)) {
      return 'Insufficient Balance'
    }
  }, [errorMessage, currencyBalances, amountA, amountB, preset])

  const onAddLiquidity = useCallback(() => {
    if (errMessage) {
      warnToast(errMessage, 'warn')
      return
    }

    onDefiedgeAdd(amountA, amountB, amountToWrap, strategy)
  }, [errMessage, strategy, amountToWrap, amountA, amountB, onDefiedgeAdd])

  const onAddLiquidityAndStake = useCallback(() => {
    if (errMessage) {
      warnToast(errMessage, 'warn')
      return
    }
    onDefiedgeAddAndStake(amountA, amountB, amountToWrap, strategy)
  }, [errMessage, amountToWrap, onDefiedgeAddAndStake, amountA, amountB, strategy])

  // get the max amounts user can add
  const maxAmounts = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => ({
      ...accumulator,
      [field]: maxAmountSpend(mintInfo.currencyBalances[field]),
    }),
    {},
  )

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        <div className='flex flex-col gap-5'>
          {isAdd && strategy && <PoolTitle strategy={strategy} />}
          <div className='flex flex-col'>
            {preset ? (
              preset.isTwap ? (
                <div className='flex flex-col gap-2'>
                  <TokenAmountCard
                    currency={baseCurrency}
                    value={formattedAmounts[Field.CURRENCY_A]}
                    handleInput={onFieldAInput}
                    maxAmount={maxAmounts[Field.CURRENCY_A]}
                    liquidityRangeType={FusionRangeType.DEFIEDGE_RANGE}
                    title={`${t('Asset')} 1`}
                    showPercent={false}
                  />
                  <TokenAmountCard
                    currency={quoteCurrency}
                    value={formattedAmounts[Field.CURRENCY_B]}
                    handleInput={onFieldBInput}
                    maxAmount={maxAmounts[Field.CURRENCY_B]}
                    liquidityRangeType={FusionRangeType.DEFIEDGE_RANGE}
                    title={`${t('Asset')} 2`}
                    showPercent={false}
                  />
                </div>
              ) : (
                <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} />
              )
            ) : (
              <Spinner />
            )}
            {/* <div className='mt-5 flex flex-col gap-4'>
              <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>
                    {unwrappedSymbol(strategy.token0)} {t('Amount')}
                  </Paragraph>
                  <Paragraph>{formatAmount(strategy.token0.reserve)}</Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>
                    {unwrappedSymbol(strategy.token1)} {t('Amount')}
                  </Paragraph>
                  <Paragraph>{formatAmount(strategy.token1.reserve)}</Paragraph>
                </div>
              </div>
            </div>
            <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
              <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
                  <Paragraph>{formatAmount(strategy.account.totalLp)} LP</Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                  <Paragraph>{formatAmount(strategy.account.gaugeBalance)} LP</Paragraph>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
      <div
        className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row', isModal && 'px-3 lg:px-6')}
      >
        {account ? (
          <>
            <SecondaryButton
              disabled={pending}
              onClick={() => {
                onAddLiquidity()
              }}
              className='w-full'
            >
              {t('Add Liquidity')}
            </SecondaryButton>
            {strategy && strategy.gauge.address !== zeroAddress && (
              <PrimaryButton
                disabled={pendingStake}
                onClick={() => {
                  onAddLiquidityAndStake()
                }}
                className='w-full'
              >
                {t('Add Liquidity & Stake')}
              </PrimaryButton>
            )}
          </>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </>
  )
}
