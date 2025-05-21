import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

import { Info, Warning } from '@/components/alert'
import { EmphasisButton } from '@/components/buttons/Button'
import { PresetRanges } from '@/components/common/AddLiquidity/components/PresetRange'
import { RangeSelector } from '@/components/common/AddLiquidity/components/RangeSelector'
import LiquidityChartRangeInput from '@/components/common/AddLiquidity/FusionAdd/LiquidityChartRangeInput'
import Input from '@/components/input'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import Selection from '@/components/selection'
import { TextHeading } from '@/components/typography'
import { useCurrency, useStableTokens } from '@/hooks/fusion/Tokens'
import { cn, unwrappedSymbol } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import {
  useActivePreset,
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import { tryParseTick } from '@/state/fusion/utils'

export function AdjustNewPositionModal({
  isOpen,
  onClose,
  firstAddress,
  secondAddress,
  feeAmount,
  // existingPosition,
  onAdjustRange,
}) {
  const t = useTranslations()

  const [isReverse, setIsReverse] = useState(false)
  const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)

  const currencyA = useCurrency(firstAddress)
  const currencyB = useCurrency(secondAddress)

  const stableAssets = useStableTokens()
  const baseCurrency = useMemo(() => (isReverse ? currencyB : currencyA), [currencyA, currencyB, isReverse])
  const quoteCurrency = useMemo(() => (isReverse ? currencyA : currencyB), [currencyA, currencyB, isReverse])

  const { leftRangeTypedValue, rightRangeTypedValue } = useV3MintState()
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency)

  const { ticksAtLimit, invertPrice, dynamicFee, pool } = mintInfo

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(baseCurrency ?? undefined, quoteCurrency ?? undefined, dynamicFee, tickLower, tickUpper, pool)

  const { startPriceTypedValue } = useV3MintState()
  const { onFieldAInput, onFieldBInput, onStartPriceInput, onLeftRangeInput, onRightRangeInput } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const activePreset = useActivePreset()

  const isStablecoinPair = useMemo(() => {
    const stablecoins = stableAssets.map(token => token.address)
    return stablecoins.includes(baseCurrency?.wrapped?.address) && stablecoins.includes(quoteCurrency?.wrapped?.address)
  }, [baseCurrency, quoteCurrency, stableAssets])

  const price = useMemo(() => {
    if (!mintInfo?.price) return
    return mintInfo?.invertPrice ? mintInfo?.price.invert().toSignificant(5) : mintInfo?.price.toSignificant(5)
  }, [mintInfo])

  // const leftPrice = useMemo(
  //   () => (baseCurrency?.wrapped.sortsBefore(quoteCurrency?.wrapped) ? priceLower : priceUpper?.invert()),
  //   [baseCurrency, quoteCurrency, priceLower, priceUpper],
  // )

  // const rightPrice = useMemo(
  //   () => (baseCurrency?.wrapped?.sortsBefore(quoteCurrency.wrapped) ? priceUpper : priceLower?.invert()),
  //   [baseCurrency, quoteCurrency, priceLower, priceUpper],
  // )

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

  // const feeString = useMemo(() => {
  //   if (mintInfo.poolState === PoolState.INVALID || mintInfo.poolState === PoolState.LOADING) return <Spinner />
  //   if (mintInfo.noLiquidity) return '0.3%'
  //   return `${mintInfo.dynamicFee / 10000}%`
  // }, [mintInfo])

  const priceRangData = useMemo(
    () => [
      {
        label: unwrappedSymbol(currencyA),
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
        label: unwrappedSymbol(currencyB),
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
      currencyA,
      currencyB,
      invertPrice,
      isReverse,
      priceLower,
      priceUpper,
      ticksAtLimit,
      onFieldAInput,
      onFieldBInput,
      onLeftRangeInput,
      onRightRangeInput,
    ],
  )

  const handlePresetRangeSelection = useCallback(
    preset => {
      if (!price) return
      // dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))
      if (preset && preset.type === Presets.FULL) {
        setFullRangeWarningShown(true)
        getSetFullRange()
      } else {
        setFullRangeWarningShown(false)
        onLeftRangeInput(preset ? String(+price * preset.min) : '')
        onRightRangeInput(preset ? String(+price * preset.max) : '')
      }
    },
    [getSetFullRange, onLeftRangeInput, onRightRangeInput, price],
  )

  const handleConfirm = () => {
    const lower = isReverse
      ? tryParseTick(baseCurrency, quoteCurrency, feeAmount, leftRangeTypedValue.toString())
      : tryParseTick(quoteCurrency, baseCurrency, feeAmount, leftRangeTypedValue.toString())

    const upper = isReverse
      ? tryParseTick(baseCurrency, quoteCurrency, feeAmount, rightRangeTypedValue.toString())
      : tryParseTick(quoteCurrency, baseCurrency, feeAmount, rightRangeTypedValue.toString())

    if (upper && lower) {
      onAdjustRange(upper, lower)
    }
  }

  return (
    <Modal width={540} isOpen={isOpen} closeModal={onClose} title={t('Adjust New Position')}>
      <ModalBody className='flex flex-col gap-5'>
        {/* RANGE TYPE */}
        <div className='flex flex-col gap-3'>
          <PresetRanges
            mintInfo={mintInfo}
            isStablecoinPair={isStablecoinPair}
            activePreset={activePreset}
            handlePresetRangeSelection={handlePresetRangeSelection}
          />
        </div>

        {mintInfo.noLiquidity && (
          <div className='flex flex-col gap-3'>
            <Info className='text-sm'>{t('Initialize warning')}</Info>
            <div className='flex items-center justify-between'>
              <TextHeading className='w-1/2'>
                {t('Starting [symbol] Price:', { symbol: baseCurrency?.symbol })}
              </TextHeading>
              <Input
                classNames={{
                  input: 'w-full pr-[150px]',
                }}
                val={startPriceTypedValue}
                onChange={e => onStartPriceInput(e.target.value)}
                suffix={t('[symbolA] per [symbolB]', {
                  symbolA: quoteCurrency?.symbol,
                  symbolB: baseCurrency?.symbol,
                })}
              />
            </div>
          </div>
        )}

        {/* PRICE RANGE */}
        <div className='flex flex-col gap-3'>
          <div className='flex flex-row items-center justify-between'>
            <TextHeading>{t('Price Range')}</TextHeading>
            <Selection data={priceRangData} isSmall />
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
            mintInfo={null}
            disabled={false}
          />

          {mintInfo.outOfRange && <Warning className='text-sm'>{t('Out range warning')}</Warning>}
          {mintInfo.invalidRange && <Warning className='text-sm'>{t('Invalid range warning')}</Warning>}
          {activePreset === Presets.FULL && fullRangeWarningShown && (
            <Warning className='text-sm'>{t('Full range position')}</Warning>
          )}

          <div
            className={cn('-mb-2 flex items-center justify-center', {
              hidden: mintInfo.noLiquidity,
            })}
          >
            <TextHeading className='text-sm'>
              {t('Current Price: [price] [symbolA] [symbolB]', {
                price: currentPrice,
                symbolA: unwrappedSymbol(quoteCurrency),
                symbolB: unwrappedSymbol(baseCurrency),
              })}
            </TextHeading>
          </div>
        </div>

        {/* CHART */}
        <LiquidityChartRangeInput
          currencyA={baseCurrency}
          currencyB={quoteCurrency}
          feeAmount={mintInfo.dynamicFee}
          ticksAtLimit={mintInfo.ticksAtLimit}
          price={price}
          priceLower={priceLower}
          priceUpper={priceUpper}
          onLeftRangeInput={onLeftRangeInput}
          onRightRangeInput={onRightRangeInput}
        />
      </ModalBody>

      <ModalFooter>
        <EmphasisButton
          disabled={!rightRangeTypedValue && !leftRangeTypedValue}
          onClick={handleConfirm}
          className='w-full'
        >
          {t('Confirm')}
        </EmphasisButton>
      </ModalFooter>
    </Modal>
  )
}
