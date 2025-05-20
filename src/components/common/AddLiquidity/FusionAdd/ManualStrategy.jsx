import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import CustomTooltip from '@/components/tooltip'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { FusionRangeType, UNKNOWN_LOGO } from '@/constant'
import { useCurrency, useStableTokens } from '@/hooks/fusion/Tokens'
import { cn, formatAmount } from '@/lib/utils'
import { useAprStore } from '@/state/APR/store'
import { Bound, setInitialTokenPrice, updateIsReverse, updateSelectedPreset } from '@/state/fusion/actions'
import {
  useActivePreset,
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import { TransferIcon, WarningTriangleIcon } from '@/svgs'

import ChartPriceRangeInput from './LiquidityChartRangeInput/ChartPriceRangeInput'
import { PresetRanges } from '../components/PresetRange'
import { RangeSelector } from '../components/RangeSelector'
import WarningStartingPrice from '../components/WarningStartingPrice'

const feeAmount = 3000

function ManualStrategy({
  firstAsset,
  secondAsset,
  strategy,
  position,
  isEarnFees,
  setFullRangeWarningShown,
  fullRangeWarningShown,
}) {
  const t = useTranslations()
  // const { isViewDown } = useMediaQuery('down', 640)
  // const { isViewUp } = useMediaQuery('up', 460)

  // const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)

  const stableAssets = useStableTokens()
  const { isReverse } = useSelector(state => state.fusion)

  const currencyA = useCurrency(firstAsset?.address)
  const currencyB = useCurrency(secondAsset?.address)
  const [lastPrice, setLastPrice] = useState(null)
  const [baseCurrency, quoteCurrency] = useMemo(
    () =>
      position
        ? [position.baseCurrency, position.quoteCurrency]
        : isReverse
          ? [currencyB, currencyA]
          : [currencyA, currencyB],
    [currencyA, currencyB, isReverse, position],
  )

  const { APRs } = useAprStore()
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])

  const showToggle = useMemo(() => firstAsset && secondAsset, [firstAsset, secondAsset])

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
    if (position) return position.currentPrice
    if (!mintInfo.price) return

    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo.invertPrice, mintInfo.price, position])

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
    [dispatch, getSetFullRange, onLeftRangeInput, onRightRangeInput, setFullRangeWarningShown, price],
  )

  // const currentPrice = useMemo(() => {
  //   if (position) return position.currentPrice
  //   if (!mintInfo.price) return

  //   const _price = mintInfo.invertPrice
  //     ? parseFloat(mintInfo.price.invert().toSignificant(5))
  //     : parseFloat(mintInfo.price.toSignificant(5))

  //   if (Number(_price) <= 0.0001) {
  //     return '< 0.0001'
  //   }
  //   return `${_price}`
  // }, [position, mintInfo.price, mintInfo.invertPrice])

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

  useEffect(() => {
    if (!startPriceTypedValue && lastPrice) {
      onStartPriceInput(`${lastPrice}`)
    }
  }, [lastPrice, onStartPriceInput, startPriceTypedValue])

  return (
    <>
      <div className='space-y-4'>
        {mintInfo.noLiquidity && (
          <div className='flex flex-col gap-4'>
            <WarningStartingPrice />

            <div className='flex items-end gap-2 md:gap-8'>
              <div className='flex w-full max-w-72 flex-col gap-1'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='text-xs font-medium text-neutral-50 md:text-base'>
                    {t('Initialization Price')}
                  </Paragraph>
                  <Paragraph className='text-base font-normal text-neutral-300'>
                    {t('[symbolA] per [symbolB]', {
                      symbolA: quoteCurrency?.symbol,
                      symbolB: baseCurrency?.symbol,
                    })}
                  </Paragraph>
                </div>
                <Input
                  classNames={{
                    input: 'leading-5',
                  }}
                  val={startPriceTypedValue}
                  min={0}
                  onChange={e => onStartPriceInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === '-' || e.key === '+') {
                      e.preventDefault()
                      return false
                    }
                  }}
                />
              </div>

              <div className='flex h-[46px] items-center gap-4'>
                <CircleImage
                  className='size-6 outline outline-[#1C2027] md:size-9'
                  src={quoteCurrency?.logoURI ?? UNKNOWN_LOGO}
                  alt='quote token'
                />
                <EmphasisIconButton
                  className='size-6 rounded-[4px] md:size-11 md:rounded-lg'
                  Icon={TransferIcon}
                  onClick={() => dispatch(updateIsReverse({ isReverse: !isReverse }))}
                />
                <CircleImage
                  className='size-6 outline outline-[#1C2027] md:size-9'
                  src={baseCurrency?.logoURI ?? UNKNOWN_LOGO}
                  alt='base token'
                />
              </div>
            </div>
          </div>
        )}

        {position && position.outOfRange ? (
          <div className={cn('flex gap-4 rounded-lg border border-error-800 bg-error-950 p-4 md:p-8')}>
            <div className='size-5 min-w-5 md:size-8 md:min-w-8'>
              <WarningTriangleIcon className='size-full' />
            </div>
            <div className='flex flex-col gap-2'>
              <NewTextHeading className='!text-xl font-medium text-error-100'>{t('OUT OF RANGE')}</NewTextHeading>
              <Paragraph className='text-base text-error-100'>{t('OUT OF RANGE description')}</Paragraph>
            </div>
          </div>
        ) : (
          !mintInfo.noLiquidity && (
            <article
              className={cn(
                'flex items-center justify-between rounded-xl border border-neutral-600 bg-neutral-900 bg-opacity-50 p-4 font-medium md:px-5 md:py-4',
                showToggle ? '' : 'hidden',
              )}
            >
              <div className='flex items-center gap-1 md:gap-3'>
                {isEarnFees ? (
                  <IconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'outline-2 size-4 md:size-8',
                    }}
                    logo1={firstAsset?.logoURI}
                    logo2={secondAsset?.logoURI}
                  />
                ) : (
                  <CircleImage
                    className='size-4 md:size-8'
                    src='https://cdn.thena.fi/assets/THE.png'
                    alt='THENA First Logo'
                  />
                )}

                {/* <NewTextSubHeading className='text-xs font-bold text-primary-100 md:text-xl'>
                  {isEarnFees ? 'Earn Fees' : 'Earn $THE'}
                </NewTextSubHeading> */}
                <div className='flex flex-col'>
                  <NewTextSubHeading className='text-xs font-bold text-primary-100 md:text-xl md:leading-6'>
                    {isEarnFees ? 'Fees' : '$THE'}
                  </NewTextSubHeading>
                  <Paragraph className='text-xs font-medium text-neutral-300 md:text-base md:leading-5'>
                    {t('Earn')}
                  </Paragraph>
                </div>
              </div>

              <div className='flex flex-col'>
                <NewTextSubHeading className='text-xs font-bold text-primary-100 md:text-xl md:leading-6'>
                  ${formatAmount(position ? position.pool?.tvl : strategy?.tvl)}
                </NewTextSubHeading>
                <Paragraph className='md:eading-5 text-xs font-medium text-neutral-300 md:text-base'>
                  {t('TVL')}
                </Paragraph>
              </div>

              <div className='flex flex-col justify-end'>
                <NewTextSubHeading className='text-end text-xs font-bold text-gradient-primary-start md:text-xl md:leading-6'>
                  {formatAmount(APRs?.current ? APRs.current : position?.apr)}%
                </NewTextSubHeading>
                <Paragraph className='text-end text-xs font-medium text-neutral-300 md:text-base md:leading-5'>
                  {t('Estimated APR')}
                </Paragraph>
              </div>
            </article>
          )
        )}
      </div>

      {strategy && (
        <div className={cn('space-y-2 md:space-y-4', mintInfo.noLiquidity && !startPriceTypedValue && 'blur-xl')}>
          <div>
            <div className='mt-0 flex flex-col xl:hidden'>
              <ChartPriceRangeInput
                currencyA={baseCurrency ?? undefined}
                currencyB={quoteCurrency ?? undefined}
                feeAmount={mintInfo.dynamicFee}
                ticksAtLimit={position?.ticksAtLimit ?? mintInfo.ticksAtLimit}
                price={price ? parseFloat(price) : undefined}
                priceLower={position?.priceLower ?? priceLower}
                priceUpper={position?.priceUpper ?? priceUpper}
                onLeftRangeInput={onLeftRangeInput}
                onRightRangeInput={onRightRangeInput}
                interactive={!position}
                showPeriod
                handleShow
                outOfRange={mintInfo.outOfRange}
                invalidRange={mintInfo.invalidRange}
                fullRangeWarningShown={fullRangeWarningShown}
                isCreate={mintInfo.noLiquidity}
                setLastPrice={setLastPrice}
              />
            </div>
            {/* <div className={cn('mt-4 flex items-center justify-center sm:mt-3', isViewDown && isViewUp && '!mt-3')}>
              <TextSubHeading className='leading-5'>
                {t('Current Price: [price] [symbolA] [symbolB]', {
                  price: currentPrice,
                  symbolA: unwrappedSymbol(quoteCurrency),
                  symbolB: unwrappedSymbol(baseCurrency),
                })}
              </TextSubHeading>
            </div> */}
          </div>

          {/* <div className='block 2xl:hidden'>
            <LiquidityChartRangeInput
              currencyA={baseCurrency ?? undefined}
              currencyB={quoteCurrency ?? undefined}
              feeAmount={mintInfo.dynamicFee}
              ticksAtLimit={position?.ticksAtLimit ?? mintInfo.ticksAtLimit}
              price={price ? parseFloat(price) : undefined}
              priceLower={position?.priceLower ?? priceLower}
              priceUpper={position?.priceUpper ?? priceUpper}
              onLeftRangeInput={onLeftRangeInput}
              onRightRangeInput={onRightRangeInput}
              interactive={false}
              showZoom={false}
            />
          </div> */}

          {!position && (
            <RangeSelector
              price={price ? parseFloat(price) : undefined}
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
          )}

          {!position && (
            <PresetRanges
              mintInfo={mintInfo}
              isStablecoinPair={isStablecoinPair}
              activePreset={activePreset}
              handlePresetRangeSelection={handlePresetRangeSelection}
            />
          )}

          <CustomTooltip id='price-tooltip' className='max-w-[320px]'>
            <TextHeading className='text-sm'>{t('Price Range Info')}</TextHeading>
          </CustomTooltip>
        </div>
      )}
    </>
  )
}

export default ManualStrategy
