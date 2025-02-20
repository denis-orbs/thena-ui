import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Warning } from '@/components/alert'
import CustomTooltip from '@/components/tooltip'
import { TextHeading } from '@/components/typography'
import { FusionRangeType } from '@/constant'
import { useCurrency, useStableTokens } from '@/hooks/fusion/Tokens'
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

import LiquidityChartRangeInput from './LiquidityChartRangeInput'
import { PresetRanges } from '../components/PresetRange'
import { RangeSelector } from '../components/RangeSelector'

const feeAmount = 3000

function ManualStrategy({ firstAsset, secondAsset }) {
  const t = useTranslations()

  const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)
  const stableAssets = useStableTokens()
  const { isReverse } = useSelector(state => state.fusion)

  const currencyA = useCurrency(firstAsset?.address)
  const currencyB = useCurrency(secondAsset?.address)
  const baseCurrency = useMemo(() => (isReverse ? currencyB : currencyA), [isReverse, currencyA, currencyB])
  const quoteCurrency = useMemo(() => (isReverse ? currencyA : currencyB), [isReverse, currencyA, currencyB])

  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])

  const dispatch = useDispatch()
  const activePreset = useActivePreset()
  const { startPriceTypedValue } = useV3MintState()

  const { onStartPriceInput, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const isStablecoinPair = useMemo(() => {
    const stablecoins = stableAssets.map(token => token.address)
    return stablecoins.includes(baseCurrency?.wrapped?.address) && stablecoins.includes(quoteCurrency?.wrapped?.address)
  }, [baseCurrency, quoteCurrency, stableAssets])

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(
      baseCurrency ?? undefined,
      quoteCurrency ?? undefined,
      mintInfo.dynamicFee,
      tickLower,
      tickUpper,
      mintInfo.pool,
    )

  const price = useMemo(() => {
    if (!mintInfo.price) return

    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo])

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
      <div className='flex items-center justify-between'>
        <TextHeading className='text-xl font-semibold'>Liquidity Range</TextHeading>
      </div>

      {activePreset === Presets.FULL && fullRangeWarningShown && (
        <Warning className='text-sm'>{t('Full range position')}</Warning>
      )}
      {mintInfo.outOfRange && <Warning className='text-sm'>{t('Out range warning')}</Warning>}
      {mintInfo.invalidRange && <Warning className='text-sm'>{t('Invalid range warning')}</Warning>}
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

      <PresetRanges
        mintInfo={mintInfo}
        isStablecoinPair={isStablecoinPair}
        activePreset={activePreset}
        handlePresetRangeSelection={handlePresetRangeSelection}
      />

      <CustomTooltip id='price-tooltip' className='max-w-[320px]'>
        <TextHeading className='text-sm'>{t('Price Range Info')}</TextHeading>
      </CustomTooltip>
    </div>
  )
}

export default ManualStrategy
