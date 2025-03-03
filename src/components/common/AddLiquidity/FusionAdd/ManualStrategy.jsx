import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Info, Warning } from '@/components/alert'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import NextImage from '@/components/image/NextImage'
import Input from '@/components/input'
import Spinner from '@/components/spinner'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { NewTextHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { FusionRangeType } from '@/constant'
import { useCurrency, useStableTokens } from '@/hooks/fusion/Tokens'
import { cn, formatAmount, unwrappedSymbol } from '@/lib/utils'
import SelectToken from '@/modules/Pools/SelectToken'
import { Bound, setInitialTokenPrice, updateIsReverse, updateSelectedPreset } from '@/state/fusion/actions'
import {
  useActivePreset,
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import { InfoIcon, TransferIcon, WarningTriangleIcon } from '@/svgs'

import LiquidityChartRangeInput from './LiquidityChartRangeInput'
import { PresetRanges } from '../components/PresetRange'
import { RangeSelector } from '../components/RangeSelector'

const feeAmount = 3000

function ManualStrategy({
  firstAsset,
  secondAsset,
  strategy,
  pair,
  defaultSwapFees,
  handleChooseStrategy,
  position,
  isLoadingManual,
  setIsLoadingManual,
}) {
  const t = useTranslations()

  const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)

  const stableAssets = useStableTokens()
  const { isReverse } = useSelector(state => state.fusion)

  const currencyA = useCurrency(firstAsset?.address)
  const currencyB = useCurrency(secondAsset?.address)
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

  const hasFarming = useMemo(() => pair?.subpools?.some(pool => pool.title === 'CL_Farming'), [pair?.subpools])
  const hasSwapFee = useMemo(() => pair?.subpools?.some(pool => pool.title === 'CL_SwapFee'), [pair?.subpools])
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
    [dispatch, getSetFullRange, onLeftRangeInput, onRightRangeInput, price],
  )

  const currentPrice = useMemo(() => {
    if (position) return position.currentPrice
    if (!mintInfo.price) return

    const _price = mintInfo.invertPrice
      ? parseFloat(mintInfo.price.invert().toSignificant(5))
      : parseFloat(mintInfo.price.toSignificant(5))

    if (Number(_price) <= 0.0001) {
      return '< 0.0001'
    }
    return `${_price}`
  }, [position, mintInfo.price, mintInfo.invertPrice])

  const resetState = useCallback(() => {
    dispatch(updateSelectedPreset({ preset: null }))
    dispatch(setInitialTokenPrice({ typedValue: '' }))
    onStartPriceInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    onChangeLiquidityRangeType(FusionRangeType.MANUAL_RANGE)
  }, [dispatch, onStartPriceInput, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType])

  const handleChangeManualType = useCallback(() => {
    setIsLoadingManual(true)
    if (strategy) {
      const _strategy = pair?.subpools.find(item =>
        strategy.isFarming ? item.title === 'CL_SwapFee' : item.title === 'CL_Farming',
      )
      handleChooseStrategy(_strategy ?? defaultSwapFees)
    }
    setTimeout(() => setIsLoadingManual(false), 1500)
  }, [defaultSwapFees, handleChooseStrategy, pair?.subpools, setIsLoadingManual, strategy])

  useEffect(() => {
    resetState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoadingManual) {
    return (
      <div className='w-full py-4'>
        <Spinner className='m-auto h-8 w-8' />
      </div>
    )
  }

  return (
    <>
      <div className={!position ? 'space-y-4' : '!mt-16'}>
        {!position && (
          <article className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <SelectToken
              selectedAsset={firstAsset}
              otherAsset={secondAsset}
              hiddenTokens={[secondAsset?.address]}
              placeHolder={t('Select Token')}
              dropdownAlign='left'
              isDisabled
            />
            <SelectToken
              selectedAsset={secondAsset}
              otherAsset={firstAsset}
              hiddenTokens={[firstAsset?.address]}
              placeHolder={t('Select Token')}
              dropdownAlign='right'
              isDisabled
            />
          </article>
        )}

        {mintInfo.noLiquidity && (
          <div className='!mt-8 flex flex-col gap-4'>
            <Info className='items-start p-8 text-sm'>
              <div className='h-8 w-8'>
                <InfoIcon className='h-8 w-8 stroke-primary-600' />
              </div>
              <div className='flex flex-col gap-2'>
                <div>
                  <TextHeading className='text-xl text-neutral-100'>{t('Starting Price needed')}</TextHeading>
                </div>
                <TextSubHeading className='text-base text-primary-100'>{t('Initialize warning')}</TextSubHeading>
              </div>
            </Info>

            <div className='flex items-center gap-2'>
              <TextHeading className='text-xl font-semibold'>{t('Start Price')}</TextHeading>
              <Input
                classNames={{
                  input: 'w-32 pr-[44px] text-right leading-5',
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
                suffix={<NextImage src={quoteCurrency?.logoURI} alt='' className='h-5 w-5' />}
              />
              <EmphasisIconButton
                Icon={TransferIcon}
                onClick={() => dispatch(updateIsReverse({ isReverse: !isReverse }))}
              />
              <TextHeading className='text-xl font-semibold'>
                {t('[symbolA] per [symbolB]', {
                  symbolA: quoteCurrency?.symbol,
                  symbolB: baseCurrency?.symbol,
                })}
              </TextHeading>
            </div>
          </div>
        )}

        {hasSwapFee && hasFarming && !position && (
          <Toggle
            checked={!strategy?.isFarming}
            onChange={handleChangeManualType}
            label='Earn Fees'
            className={cn(showToggle ? '' : 'hidden')}
          />
        )}

        {!position?.outOfRange ? (
          <article
            className={cn(
              'flex items-center justify-between rounded-xl bg-primary-950 p-6 font-medium',
              showToggle ? '' : 'hidden',
            )}
          >
            <div className='flex flex-col gap-1'>
              <Paragraph className='text-neutral-400'>
                {(position && !position.pool?.isFarming) || strategy?.title === 'CL_SwapFee' ? 'Earn Fees' : 'Earn THE'}
              </Paragraph>
              <div className='flex flex-wrap gap-2'>
                <div className='flex items-center gap-1'>
                  <Paragraph className='text-neutral-400'>{t('TVL')}:</Paragraph>
                  <TextHeading className='text-neutral-300'>
                    ${formatAmount(position ? position.pool?.tvl : strategy?.tvl)}
                  </TextHeading>
                </div>
              </div>
            </div>

            <div className='flex flex-wrap justify-end gap-2'>
              <TextHeading className='text-center font-archia'>
                <Paragraph className='text-neutral-400'>Estimate APR</Paragraph>
                <p className='text-xl font-semibold text-primary-600'>
                  {formatAmount(position ? position.apr : mintInfo?.estimateAPR?.current)}%
                </p>
              </TextHeading>

              {strategy?.title === 'CL_SwapFee' ? (
                <IconGroup
                  className='-space-x-2'
                  classNames={{
                    image: 'outline-2 w-7 h-7',
                  }}
                  logo1={firstAsset?.logoURI}
                  logo2={secondAsset?.logoURI}
                />
              ) : (
                <CircleImage
                  className={cn('size-7')}
                  src='https://cdn.thena.fi/assets/THE.png'
                  alt='THENA First Logo'
                />
              )}
            </div>
          </article>
        ) : (
          <div className={cn('flex gap-4 rounded-lg border border-error-800 bg-error-950 p-8')}>
            <div className='size-8 min-w-8'>
              <WarningTriangleIcon className='size-full' />
            </div>
            <div className='flex flex-col gap-2'>
              <NewTextHeading className='!text-xl font-medium text-error-100'>{t('OUT OF RANGE')}</NewTextHeading>
              <Paragraph className='text-base text-error-100'>{t('OUT OF RANGE description')}</Paragraph>
            </div>
          </div>
        )}
      </div>

      {strategy && (
        <div className={cn('flex flex-col gap-4', mintInfo.noLiquidity && !startPriceTypedValue && 'blur-xl')}>
          <div className='flex items-center justify-between'>
            <NewTextHeading className='!text-xl font-semibold'>
              {mintInfo.noLiquidity ? 'Price Range' : 'Liquidity Range'}
            </NewTextHeading>
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
            <div className='mb-5 mt-0'>
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
                interactive={!position}
              />
            </div>
          )}

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
