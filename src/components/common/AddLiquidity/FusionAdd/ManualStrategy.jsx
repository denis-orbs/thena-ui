import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import CustomTooltip from '@/components/tooltip'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { FusionRangeType, STABLE_PAIRS, UNKNOWN_LOGO } from '@/constant'
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
import { TransferIcon, WarningTriangleYellowIcon } from '@/svgs'

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
  setLastPrice = () => {},
}) {
  const dispatch = useDispatch()
  const t = useTranslations()
  const { isReverse } = useSelector(state => state.fusion)

  const stableAssets = useStableTokens()
  const { startPriceTypedValue } = useV3MintState()
  const activePreset = useActivePreset()
  const currencyA = useCurrency(firstAsset?.address)
  const currencyB = useCurrency(secondAsset?.address)
  const { APRs } = useAprStore()

  const [baseCurrency, quoteCurrency] = useMemo(
    () =>
      position
        ? [position.baseCurrency, position.quoteCurrency]
        : isReverse
          ? [currencyB, currencyA]
          : [currencyA, currencyB],
    [currencyA, currencyB, isReverse, position],
  )

  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])

  const showToggle = useMemo(() => firstAsset && secondAsset, [firstAsset, secondAsset])

  const {
    onStartPriceInput,
    onLeftRangeInput,
    onRightRangeInput,
    onChangeLiquidityRangeType,
    onFieldAInput,
    onFieldBInput,
  } = useV3MintActionHandlers(mintInfo.noLiquidity)

  const isStablecoinPair = useMemo(() => {
    if (STABLE_PAIRS.includes(mintInfo.poolAddress?.toLowerCase())) return true
    const stableCoins = stableAssets.map(token => token.address)
    return stableCoins.includes(baseCurrency?.wrapped?.address) && stableCoins.includes(quoteCurrency?.wrapped?.address)
  }, [baseCurrency, mintInfo.poolAddress, quoteCurrency, stableAssets])

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(
      baseCurrency ?? undefined,
      quoteCurrency ?? undefined,
      mintInfo.dynamicFee,
      tickLower,
      tickUpper,
      mintInfo.pool,
      mintInfo.tickSpacing,
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

  const resetState = useCallback(() => {
    dispatch(updateSelectedPreset({ preset: null }))
    dispatch(setInitialTokenPrice({ typedValue: '' }))
    onStartPriceInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    onChangeLiquidityRangeType(FusionRangeType.MANUAL_RANGE)
  }, [dispatch, onStartPriceInput, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType])

  const handleRevert = useCallback(() => {
    if (!mintInfo?.ticksAtLimit[Bound.LOWER] && !mintInfo?.ticksAtLimit[Bound.UPPER]) {
      onLeftRangeInput((mintInfo.invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
      onRightRangeInput((mintInfo.invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
    }
    dispatch(updateIsReverse({ isReverse: !isReverse }))
    onFieldAInput('')
    onFieldBInput('')
    onStartPriceInput(mintInfo.invertPrice ? mintInfo.price.toSignificant(5) : mintInfo.price.invert().toSignificant(5))
  }, [
    dispatch,
    isReverse,
    mintInfo.invertPrice,
    mintInfo.price,
    mintInfo?.ticksAtLimit,
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
    priceLower,
    priceUpper,
  ])

  useEffect(() => {
    resetState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className='flex flex-col gap-4'>
        {mintInfo.noLiquidity && (
          <div className='flex flex-col gap-4'>
            <WarningStartingPrice />

            <div className='flex items-end justify-between gap-2 md:gap-8'>
              <div className='flex w-full max-w-72 flex-col gap-1 xl:gap-2'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='xl:text-4 text-xs font-medium text-neutral-50 md:text-base xl:leading-5'>
                    {t('Initialization Price')}
                  </Paragraph>
                  <Paragraph className='xl:text-4 text-base font-normal text-neutral-300 xl:leading-5'>
                    {t('[symbolA] per [symbolB]', {
                      symbolA: quoteCurrency?.symbol,
                      symbolB: baseCurrency?.symbol,
                    })}
                  </Paragraph>
                </div>
                <Input
                  classNames={{
                    input: 'leading-5 xl:py-0 xl:h-11',
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

              <div className='flex h-[46px] items-center gap-4 xl:h-11'>
                <CircleImage
                  className='size-6 outline-[#1C2027] outline-solid md:size-9'
                  src={quoteCurrency?.logoURI ?? UNKNOWN_LOGO}
                  alt='quote token'
                />
                <EmphasisIconButton
                  className='size-6 rounded-[4px] md:size-11 md:rounded-lg'
                  Icon={TransferIcon}
                  onClick={handleRevert}
                />
                <CircleImage
                  className='size-6 outline-[#1C2027] outline-solid md:size-9'
                  src={baseCurrency?.logoURI ?? UNKNOWN_LOGO}
                  alt='base token'
                />
              </div>
            </div>
          </div>
        )}

        {position && position.outOfRange ? (
          <div className={cn('border-warn-900 bg-warn-950 flex gap-4 rounded-lg border px-5 py-4 max-sm:mt-4 xl:mb-2')}>
            <div className='size-5 min-w-5 md:size-8 md:min-w-8'>
              <WarningTriangleYellowIcon className='stroke-warn-600 size-full' />
            </div>
            <div className='flex flex-col gap-1'>
              <NewTextHeading className='text-warn-100 text-xl! font-medium'>{t('OUT OF RANGE')}</NewTextHeading>
              <Paragraph className='text-warn-100 text-base! leading-5'>{t('OUT OF RANGE description')}</Paragraph>
            </div>
          </div>
        ) : (
          !mintInfo.noLiquidity && (
            <article
              className={cn(
                'bg-opacity-50 flex items-center justify-between rounded-xl border border-neutral-600 bg-neutral-900 p-4 font-medium max-md:mt-4 max-sm:mt-2 md:mt-2 md:px-5 md:py-4 xl:mt-0',
                showToggle ? '' : 'hidden',
              )}
            >
              <div className='flex items-center gap-1 md:gap-3 xl:gap-2'>
                {isEarnFees ? (
                  <IconGroup
                    className='*:not-first:-ml-2'
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
                <div className='flex flex-col gap-1'>
                  <NewTextSubHeading className='text-primary-100 xl:text-5 text-xs font-bold md:text-xl md:leading-6 xl:leading-7'>
                    {isEarnFees ? 'Fees' : '$THE'}
                  </NewTextSubHeading>
                  <Paragraph className='xl:text-4 text-xs font-medium text-neutral-300 md:text-base md:leading-5 xl:leading-5'>
                    {t('Earn')}
                  </Paragraph>
                </div>
              </div>

              <div className='flex flex-col xl:gap-1'>
                <NewTextSubHeading className='text-primary-100 xl:text-5 text-xs font-bold md:text-xl md:leading-6 xl:leading-7'>
                  ${formatAmount(position ? position.pool?.tvl : strategy?.tvl)}
                </NewTextSubHeading>
                <Paragraph className='md:eading-5 xl:text-4 text-xs font-medium text-neutral-300 md:text-base xl:leading-5'>
                  {t('TVL')}
                </Paragraph>
              </div>

              <div className='flex flex-col justify-end xl:gap-1'>
                <NewTextSubHeading className='xl:text-5 bg-[linear-gradient(90deg,_#B386FF_0%,_#FF86FA_100%)] bg-clip-text text-end text-xs font-bold text-transparent md:text-xl md:leading-6 xl:leading-7'>
                  {formatAmount(
                    APRs?.[activePreset ?? 'current'] && APRs[activePreset ?? 'current'].isZero()
                      ? strategy?.apr
                      : APRs?.[activePreset ?? 'current'],
                  )}
                  %
                </NewTextSubHeading>
                <Paragraph className='xl:text-4 text-end text-xs font-medium text-neutral-300 md:text-base md:leading-5 xl:leading-5'>
                  {t(isEarnFees ? 'Historical Weekly APR' : 'Estimated APR')}
                </Paragraph>
              </div>
            </article>
          )
        )}
      </div>

      {strategy && (
        <div className={cn('flex flex-col gap-2 md:gap-4', mintInfo.noLiquidity && !startPriceTypedValue && 'blur-xl')}>
          <div>
            <div className='mt-2 flex flex-col xl:hidden'>
              <ChartPriceRangeInput
                maskColor='#0D090F'
                currencyA={baseCurrency ?? undefined}
                currencyB={quoteCurrency ?? undefined}
                feeAmount={mintInfo.dynamicFee}
                ticksAtLimit={position?.ticksAtLimit ?? mintInfo.ticksAtLimit}
                price={price ? Number.parseFloat(price) : undefined}
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
                idChart='mobile-chart-price-range'
              />
            </div>
          </div>

          {!position && (
            <RangeSelector
              price={price ? Number.parseFloat(price) : undefined}
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
