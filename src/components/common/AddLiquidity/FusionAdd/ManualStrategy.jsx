import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Info, Warning } from '@/components/alert'
import Input from '@/components/input'
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

      <div className='flex items-center justify-between'>
        <TextHeading className='text-xl font-medium'>Liquidity Range</TextHeading>
        {/* <Selection data={assetSelections} isSmall isTranslation={false} /> */}
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

      {/* <div className='grid grid-cols-2 gap-4'> */}
      {/*   <div className='flex flex-col justify-center gap-1.5 rounded-md bg-neutral-800 px-4 py-3'> */}
      {/*     <TextHeading className='text-sm' data-tooltip-id='APR-INFO'> */}
      {/*       Estimate APR for $1k */}
      {/*     </TextHeading> */}
      {/**/}
      {/*     <div data-tooltip-id='APR-INFO' className='w-fit rounded-md bg-neutral-700 p-2'> */}
      {/*       <TextHeading className='text-sm font-bold'>{Number(apr).toFixed(2)}%</TextHeading> */}
      {/*     </div> */}
      {/*     <CustomTooltip id='APR-INFO' className='max-w-[320px]'> */}
      {/*       Estimated return based on weekly trade fees and farming yield */}
      {/*     </CustomTooltip> */}
      {/*   </div> */}
      {/**/}
      {/*   <div className='flex flex-col gap-3'> */}
      {/*     <div className='flex flex-col gap-1.5 rounded-md bg-neutral-800 px-4 py-2'> */}
      {/*       <div className='mt-1 flex cursor-pointer items-center justify-between'> */}
      {/*         <TextHeading className='text-sm'>{t(mintInfo.noLiquidity ? 'New pool' : 'Current Pool')}</TextHeading> */}
      {/*         <strong className='text-sm'> */}
      {/*           {feeString} {t('Fee')} */}
      {/*         </strong> */}
      {/*       </div> */}
      {/*     </div> */}
      {/*     <div className='flex items-center justify-between rounded-md bg-neutral-800 px-4 py-2'> */}
      {/*       <TextHeading className='text-sm'>{t('Risk')}</TextHeading> */}
      {/*       {_risk && ( */}
      {/*         <div className='flex items-center gap-2'> */}
      {/*           {[1, 2, 3, 4, 5].map((_, i) => ( */}
      {/*             <div key={i} className='h-2 w-2 overflow-hidden rounded-full bg-neutral-700'> */}
      {/*               <div */}
      {/*                 key={`risk-${i}`} */}
      {/*                 className='relative h-2 bg-error-600' */}
      {/*                 style={{ left: `calc(-100% + ${_risk[i]}%)` }} */}
      {/*               /> */}
      {/*             </div> */}
      {/*           ))} */}
      {/*         </div> */}
      {/*       )} */}
      {/*     </div> */}
      {/*     <div className='flex flex-col gap-1.5 rounded-md bg-neutral-800 px-4 py-2'> */}
      {/*       <div className='mt-1 flex items-center justify-between'> */}
      {/*         <TextHeading className='text-sm'>{t('Profit')}</TextHeading> */}
      {/*         {_risk && ( */}
      {/*           <div className='flex items-center gap-2'> */}
      {/*             {[1, 2, 3, 4, 5].map((_, i) => ( */}
      {/*               <div key={i} className='h-2 w-2 overflow-hidden rounded-full bg-neutral-700'> */}
      {/*                 <div */}
      {/*                   key={`risk-${i}`} */}
      {/*                   className='relative h-2 bg-success-600' */}
      {/*                   style={{ left: `calc(-100% + ${_risk[i]}%)` }} */}
      {/*                 /> */}
      {/*               </div> */}
      {/*             ))} */}
      {/*           </div> */}
      {/*         )} */}
      {/*       </div> */}
      {/*     </div> */}
      {/*   </div> */}
      {/* </div> */}

      {/* <div className={cn('hidden', priceLower && priceUpper && 'block')}> */}
      {/*   <div className='flex flex-col items-start gap-2 lg:flex-row lg:justify-between'> */}
      {/*     <h6 className='font-bold'>Historical price</h6> */}
      {/*     <Tabs data={periods} /> */}
      {/*   </div> */}
      {/**/}
      {/*   {isLoading ? ( */}
      {/*     <Skeleton className='mt-2 flex h-[300px] items-center justify-center' /> */}
      {/*   ) : ( */}
      {/*     <div className='mt-2 flex h-[300px] items-center justify-center'> */}
      {/*       {error ? ( */}
      {/*         <Paragraph>Failed to load price chart for this pair</Paragraph> */}
      {/*       ) : ( */}
      {/*         <PoolChart */}
      {/*           data={pairPrices} */}
      {/*           timeWindow={timeWindow} */}
      {/*           current={Number(currentPrice)} */}
      {/*           upper={mintInfo?.ticksAtLimit[Bound.UPPER] ? Infinity : Number(rightPrice?.toSignificant(5)) ?? 0} */}
      {/*           lower={mintInfo?.ticksAtLimit[Bound.LOWER] ? 0 : Number(leftPrice?.toSignificant(5)) ?? 0} */}
      {/*         /> */}
      {/*       )} */}
      {/*     </div> */}
      {/*   )} */}
      {/* </div> */}
      {/* <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} />
      <ManualAdd baseCurrency={baseCurrency} quoteCurrency={quoteCurrency} mintInfo={mintInfo} /> */}

      <CustomTooltip id='price-tooltip' className='max-w-[320px]'>
        <TextHeading className='text-sm'>{t('Price Range Info')}</TextHeading>
      </CustomTooltip>
    </div>
  )
}

export default ManualStrategy
