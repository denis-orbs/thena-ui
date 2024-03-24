import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { Info, Warning } from '@/components/alert'
import Input from '@/components/input'
import Selection from '@/components/selection'
import Spinner from '@/components/spinner'
import CustomTooltip from '@/components/tooltip'
import { TextHeading } from '@/components/typography'
import { FusionRangeType } from '@/constant'
import { useCurrency, useStableTokens } from '@/hooks/fusion/Tokens'
import { PoolState } from '@/hooks/fusion/useFusions'
import { unwrappedSymbol } from '@/lib/utils'
import { Bound, setInitialTokenPrice, updateSelectedPreset } from '@/state/fusion/actions'
import {
  useActivePreset,
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'

import { EnterAmounts } from './containers/EnterAmounts'
import LiquidityChartRangeInput from './LiquidityChartRangeInput'
import ManualAdd from './ManualAdd'
import { PresetRanges } from '../components/PresetRange'
import { RangeSelector } from '../components/RangeSelector'

const feeAmount = 3000

function ManualStrategy({ firstAsset, secondAsset, isReverse, setIsReverse }) {
  const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)
  const currencyA = useCurrency(firstAsset ? firstAsset.address : undefined)
  const currencyB = useCurrency(secondAsset ? secondAsset.address : undefined)
  const stableAssets = useStableTokens()
  const baseCurrency = useMemo(() => (isReverse ? currencyB : currencyA), [isReverse, currencyA, currencyB])
  const quoteCurrency = useMemo(() => (isReverse ? currencyA : currencyB), [isReverse, currencyA, currencyB])
  const mintInfo = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    undefined,
  )
  const { ticksAtLimit, invertPrice } = mintInfo
  const t = useTranslations()

  const dispatch = useDispatch()
  const activePreset = useActivePreset()
  const { startPriceTypedValue } = useV3MintState()

  const {
    onFieldAInput,
    onFieldBInput,
    onStartPriceInput,
    onLeftRangeInput,
    onRightRangeInput,
    onChangeLiquidityRangeType,
  } = useV3MintActionHandlers(mintInfo.noLiquidity)

  const isStablecoinPair = useMemo(() => {
    const stablecoins = stableAssets.map(token => token.address)
    return stablecoins.includes(baseCurrency.wrapped.address) && stablecoins.includes(quoteCurrency.wrapped.address)
  }, [baseCurrency, quoteCurrency, stableAssets])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])

  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(
      baseCurrency ?? undefined,
      quoteCurrency ?? undefined,
      mintInfo.dynamicFee,
      tickLower,
      tickUpper,
      mintInfo.pool,
    )

  const leftPrice = useMemo(
    () => (baseCurrency.wrapped.sortsBefore(quoteCurrency.wrapped) ? priceLower : priceUpper?.invert()),
    [baseCurrency, quoteCurrency, priceLower, priceUpper],
  )

  const rightPrice = useMemo(
    () => (baseCurrency.wrapped.sortsBefore(quoteCurrency.wrapped) ? priceUpper : priceLower?.invert()),
    [baseCurrency, quoteCurrency, priceLower, priceUpper],
  )

  const price = useMemo(() => {
    if (!mintInfo.price) return

    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo])

  const assetSelections = useMemo(
    () => [
      {
        label: unwrappedSymbol(firstAsset),
        active: !isReverse,
        onClickHandler: () => {
          setIsReverse(false)
          if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
            onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
            onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
          }
          onFieldAInput('')
          onFieldBInput('')
        },
      },
      {
        label: unwrappedSymbol(secondAsset),
        active: isReverse,
        onClickHandler: () => {
          setIsReverse(true)
          if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
            onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
            onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
          }
          onFieldAInput('')
          onFieldBInput('')
        },
      },
    ],
    [
      isReverse,
      setIsReverse,
      firstAsset,
      secondAsset,
      invertPrice,
      onFieldAInput,
      onFieldBInput,
      onLeftRangeInput,
      onRightRangeInput,
      priceLower,
      priceUpper,
      ticksAtLimit,
    ],
  )

  const handlePresetRangeSelection = useCallback(
    preset => {
      if (!price) return

      dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))

      if (preset && preset.type === Presets.FULL) {
        setFullRangeWarningShown(true)
        getSetFullRange()
      } else {
        setFullRangeWarningShown(false)
        onLeftRangeInput(preset ? String(+price * preset.min) : '')
        onRightRangeInput(preset ? String(+price * preset.max) : '')
      }
    },
    [dispatch, getSetFullRange, onLeftRangeInput, onRightRangeInput, price],
  )

  const currentPrice = useMemo(() => {
    if (!mintInfo.price) return

    const _price = mintInfo.invertPrice
      ? parseFloat(mintInfo.price.invert().toSignificant(5))
      : parseFloat(mintInfo.price.toSignificant(5))

    if (Number(_price) <= 0.0001) {
      return '< 0.0001'
    }
    return `${_price}`
  }, [mintInfo.price, mintInfo.invertPrice])

  const feeString = useMemo(() => {
    if (mintInfo.poolState === PoolState.INVALID || mintInfo.poolState === PoolState.LOADING) return <Spinner />

    if (mintInfo.noLiquidity) return '0.3%'

    return `${mintInfo.dynamicFee / 10000}%`
  }, [mintInfo])

  const risk = useMemo(() => {
    const upPrice = rightPrice?.toSignificant(5)
    const downPrice = leftPrice?.toSignificant(5)
    if (!upPrice || !downPrice || !price) return

    const upperPercent = 100 - (+price / +upPrice) * 100
    const lowerPercent = Math.abs(100 - (+price / +downPrice) * 100)

    const rangePercent = +downPrice > +price && +upPrice > 0 ? upperPercent - lowerPercent : upperPercent + lowerPercent

    if (rangePercent < 7.5) {
      return 5
    }
    if (rangePercent < 15) {
      return (15 - rangePercent) / 7.5 + 4
    }
    if (rangePercent < 30) {
      return (30 - rangePercent) / 15 + 3
    }
    if (rangePercent < 60) {
      return (60 - rangePercent) / 30 + 2
    }
    if (rangePercent < 120) {
      return (120 - rangePercent) / 60 + 1
    }
    return 1
  }, [price, rightPrice, leftPrice])

  const _risk = useMemo(() => {
    const res = []
    const split = risk?.toString().split('.')

    if (!split) return

    for (let i = 0; i < 10; i++) {
      if (i < +split[0]) {
        res.push(100)
      } else if (i === +split[0]) {
        res.push(parseFloat(`0.${split[1]}`) * 100)
      } else {
        res.push(0)
      }
    }

    return res
  }, [risk])

  const resetState = useCallback(() => {
    dispatch(updateSelectedPreset({ preset: null }))
    dispatch(setInitialTokenPrice({ typedValue: '' }))
    onStartPriceInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    onChangeLiquidityRangeType(FusionRangeType.MANUAL_RANGE)
  }, [dispatch, onStartPriceInput, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType])

  useEffect(() => {
    resetState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='flex flex-col gap-4'>
      <PresetRanges
        mintInfo={mintInfo}
        isStablecoinPair={isStablecoinPair}
        activePreset={activePreset}
        handlePresetRangeSelection={handlePresetRangeSelection}
      />
      {mintInfo.noLiquidity && (
        <div className='flex flex-col gap-3'>
          <Info className='text-sm'>{t('Initialize warning')}</Info>
          <div className='flex items-center justify-between'>
            <TextHeading className='w-1/2'>Starting {baseCurrency?.symbol} Price:</TextHeading>
            <Input
              classNames={{
                input: 'w-full pr-[150px]',
              }}
              val={startPriceTypedValue}
              onChange={e => onStartPriceInput(e.target.value)}
              suffix={`${quoteCurrency?.symbol} per ${baseCurrency?.symbol}`}
            />
          </div>
        </div>
      )}
      <div className='flex items-center justify-between'>
        <TextHeading>Price Range</TextHeading>
        <Selection data={assetSelections} isSmall />
      </div>
      <RangeSelector
        priceLower={priceLower}
        priceUpper={priceUpper}
        getDecrementLower={getDecrementLower}
        getIncrementLower={getIncrementLower}
        getDecrementUpper={getDecrementUpper}
        getIncrementUpper={getIncrementUpper}
        onLeftRangeInput={onLeftRangeInput}
        onRightRangeInput={onRightRangeInput}
        currencyA={baseCurrency}
        currencyB={quoteCurrency}
        mintInfo={mintInfo}
        disabled={!startPriceTypedValue && !mintInfo.price}
      />
      {activePreset === Presets.FULL && fullRangeWarningShown && (
        <Warning className='text-sm'>Full range position may earn less than concentrated position.</Warning>
      )}
      {mintInfo.outOfRange && (
        <Warning className='text-sm'>
          Your position will not earn fees or be used in trades until the market price moves into your range.
        </Warning>
      )}
      {mintInfo.invalidRange && (
        <Warning className='text-sm'>Invalid range selected. The min price must be lower than the max price.</Warning>
      )}
      {!mintInfo.noLiquidity && (
        <div className='-mb-2 flex items-center justify-center'>
          <TextHeading className='text-sm'>
            {t('Current Price: [price] [symbolA] [symbolB]', {
              price: currentPrice,
              symbolA: unwrappedSymbol(quoteCurrency),
              symbolB: unwrappedSymbol(baseCurrency),
            })}
          </TextHeading>
        </div>
      )}
      {!mintInfo.noLiquidity && (
        <div className='mt-0'>
          <LiquidityChartRangeInput
            currencyA={baseCurrency ?? undefined}
            currencyB={quoteCurrency ?? undefined}
            feeAmount={mintInfo.dynamicFee}
            ticksAtLimit={mintInfo.ticksAtLimit}
            price={price ? parseFloat(price) : undefined}
            priceLower={priceLower}
            priceUpper={priceUpper}
            onLeftRangeInput={onLeftRangeInput}
            onRightRangeInput={onRightRangeInput}
          />
        </div>
      )}
      <div className='grid grid-cols-2 gap-4'>
        <div className='flex flex-col justify-center gap-1.5 rounded-md bg-neutral-800 px-4 py-3'>
          <TextHeading className='text-sm'>{mintInfo.noLiquidity ? 'New pool' : 'Current Pool'}</TextHeading>
          <div className='w-fit rounded-md bg-neutral-700 p-2'>
            <TextHeading className='text-sm'>{feeString} fee</TextHeading>
          </div>
        </div>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between rounded-md bg-neutral-800 px-4 py-2'>
            <TextHeading className='text-sm'>Risk</TextHeading>
            {_risk && (
              <div className='flex items-center gap-2'>
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className='h-2 w-2 overflow-hidden rounded-full bg-neutral-700'>
                    <div
                      key={`risk-${i}`}
                      className='relative h-2 bg-error-600'
                      style={{ left: `calc(-100% + ${_risk[i]}%)` }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className='flex flex-col gap-1.5 rounded-md bg-neutral-800 px-4 py-2'>
            <div className='mt-1 flex items-center justify-between'>
              <TextHeading className='text-sm'>Profit</TextHeading>
              {_risk && (
                <div className='flex items-center gap-2'>
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className='h-2 w-2 overflow-hidden rounded-full bg-neutral-700'>
                      <div
                        key={`risk-${i}`}
                        className='relative h-2 bg-success-600'
                        style={{ left: `calc(-100% + ${_risk[i]}%)` }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} />
      <ManualAdd baseCurrency={baseCurrency} quoteCurrency={quoteCurrency} mintInfo={mintInfo} />
      <CustomTooltip id='price-tooltip' className='max-w-[320px]'>
        <TextHeading className='text-sm'>{t('Price Range Info')}</TextHeading>
      </CustomTooltip>
    </div>
  )
}

export default ManualStrategy
