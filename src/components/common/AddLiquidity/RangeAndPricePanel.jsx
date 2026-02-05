import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import AddLiquidityCLPane from '@/app/pools/(add-liquidity)/add-liquidity/ClPool/AddLiquidityCLPane'
import Toggle from '@/components/toggle'
import { TextHeading } from '@/components/typography'
import { STABLE_PAIRS } from '@/constant'
import { useStableTokens } from '@/hooks/fusion/Tokens'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Bound, updateSelectedPreset } from '@/state/fusion/actions'
import { useActivePreset, useRangeHopCallbacks } from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import cn from '@/utils/classes'

import { PresetRanges } from './components/PresetRange'
import RangePriceInfo from './components/RangePriceInfo'
import { RangeSelector } from './components/RangeSelector'
import ChartPriceRangeInput from './FusionAdd/LiquidityChartRangeInput/ChartPriceRangeInput'

const CLASS_NAMES = Object.freeze({
  title: 'xl:text-xl! xl:leading-6!',
  chart: 'h-full! w-full',
  handleArea: 'max-xl:bg-chart-gradient!',
  bottomAxis: 'max-xl:border-none! xl:max-h-11 xl:h-11',
})

export function RangeAndPricePanel({
  currencyA,
  currencyB,
  mintInfo,
  currentPrice,
  position,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  setLastPrice,
  viewMode = false,
  pair,
}) {
  const t = useTranslations()
  const [degenMode, setDegenMode] = useState(false)
  const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)
  const activePreset = useActivePreset()
  const stableAssets = useStableTokens()
  const dispatch = useDispatch()
  const { isLgDown } = useMediaQuery()

  const chartHeight = useMemo(() => {
    if (isLgDown) return 265
    if (position) {
      return 324
    }
    return 286
  }, [isLgDown, position])

  const isStablecoinPair = useMemo(() => {
    if (STABLE_PAIRS.includes(mintInfo.poolAddress?.toLowerCase())) return true
    const stableCoins = stableAssets.map(token => token.address)
    return stableCoins.includes(currencyA?.wrapped?.address) && stableCoins.includes(currencyB?.wrapped?.address)
  }, [currencyA, mintInfo.poolAddress, currencyB, stableAssets])

  const { getSetFullRange, getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } =
    useRangeHopCallbacks(
      currencyA ?? undefined,
      currencyB ?? undefined,
      mintInfo.dynamicFee,
      position?.tickLower ?? mintInfo.ticks[Bound.LOWER],
      position?.tickUpper ?? mintInfo.ticks[Bound.UPPER],
      mintInfo.pool,
      mintInfo.tickSpacing,
    )

  const handlePresetRangeSelection = useCallback(
    preset => {
      if (!currentPrice) return

      dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))

      if (preset && preset.type === Presets.FULL) {
        setFullRangeWarningShown(true)
        getSetFullRange()
      } else {
        setFullRangeWarningShown(false)
        onLeftRangeInput(preset ? String(+currentPrice * preset.min) : '')
        onRightRangeInput(preset ? String(+currentPrice * preset.max) : '')
      }
    },
    [dispatch, getSetFullRange, onLeftRangeInput, onRightRangeInput, currentPrice],
  )

  // Reusable components to eliminate duplication
  const RangePriceInfoComponent = useCallback(
    () => <RangePriceInfo baseCurrency={currencyA} quoteCurrency={currencyB} position={position} />,
    [currencyA, currencyB, position],
  )

  const PresetRangesComponent = useCallback(
    ({ isMobile = false, className = '' }) => (
      <PresetRanges
        mintInfo={mintInfo}
        isStablecoinPair={isStablecoinPair}
        activePreset={activePreset}
        handlePresetRangeSelection={handlePresetRangeSelection}
        className={cn(
          'grid gap-2',
          isMobile ? 'grid-cols-2 gap-1' : 'mt-auto grid-cols-4',
          isMobile ? 'bg-transparent' : '',
          className,
        )}
        isMiniItem={!isMobile}
        classNames={{ items: 'border border-neutral-600' }}
      />
    ),
    [mintInfo, isStablecoinPair, activePreset, handlePresetRangeSelection],
  )

  return (
    <div className='grid grid-cols-1 gap-4 bg-transparent max-xl:border-none xl:grid-cols-[1fr_368px] xl:gap-8 xl:rounded-xl xl:bg-neutral-900 xl:p-4 xl:outline-1 xl:outline-neutral-600'>
      {/* Main Chart Section */}
      <div className='order-2 flex h-auto w-full flex-col gap-4 xl:order-1'>
        {viewMode && (
          <>
            <TextHeading className={cn('font-archia block text-xl! leading-6! font-semibold xl:hidden')}>
              {t('Your Range against the Price')}
            </TextHeading>

            {/* Mobile ViewMode: Show RangePriceInfo */}
            <div className='block xl:hidden'>
              <RangePriceInfoComponent />
            </div>
          </>
        )}

        <div className='chart-wrapper w-full flex-1'>
          <ChartPriceRangeInput
            currencyA={currencyA ?? undefined}
            currencyB={currencyB ?? undefined}
            feeAmount={mintInfo.dynamicFee}
            ticksAtLimit={position?.ticksAtLimit ?? mintInfo.ticksAtLimit}
            price={currentPrice ? parseFloat(currentPrice) : undefined}
            priceLower={position?.priceLower ?? priceLower}
            priceUpper={position?.priceUpper ?? priceUpper}
            onLeftRangeInput={onLeftRangeInput}
            onRightRangeInput={onRightRangeInput}
            showPeriod
            handleShow
            outOfRange={position?.outOfRange ?? mintInfo.outOfRange}
            invalidRange={mintInfo.invalidRange}
            fullRangeWarningShown={fullRangeWarningShown}
            isCreate={mintInfo.noLiquidity}
            setLastPrice={setLastPrice}
            label='Your Range against the Price'
            showLabel={!viewMode || !isLgDown}
            classNames={CLASS_NAMES}
            interactive={!viewMode || !position}
            height={isLgDown ? 279 : chartHeight}
          />
        </div>
      </div>

      {/* Sidebar Section */}
      <div className={cn('order-1 h-auto xl:order-2 xl:flex', viewMode && 'max-xl:hidden')}>
        <div className='flex w-full flex-col gap-4 xl:h-full'>
          {!viewMode ? (
            <div className='flex flex-col gap-4 xl:mt-auto'>
              <Toggle
                toggleId='degen-mode'
                checked={degenMode}
                className='mt-0! hidden' // TODO: remove hidden when degen mode is ready
                onChange={() => setDegenMode(prev => !prev)}
                label='Degen Mode'
              />
              <RangeSelector
                price={currentPrice ? parseFloat(currentPrice) : undefined}
                priceLower={position?.priceLower ?? priceLower}
                priceUpper={position?.priceUpper ?? priceUpper}
                onLeftRangeInput={onLeftRangeInput}
                onRightRangeInput={onRightRangeInput}
                getDecrementLower={getDecrementLower}
                getIncrementLower={getIncrementLower}
                getDecrementUpper={getDecrementUpper}
                getIncrementUpper={getIncrementUpper}
                currencyA={currencyA}
                currencyB={currencyB}
                mintInfo={mintInfo}
                disabled={viewMode}
                className='flex-col!'
              />

              {/* Desktop PresetRanges */}
              <div className='max-xl:hidden'>
                <PresetRangesComponent className='mt-auto' />
              </div>
            </div>
          ) : (
            /* Desktop ViewMode Content */
            <div className='mt-auto hidden flex-col gap-3 xl:flex'>
              <RangePriceInfoComponent />
              <div className='mt-auto h-fit'>
                <AddLiquidityCLPane
                  baseCurrency={currencyA}
                  quoteCurrency={currencyB}
                  setBaseCurrency={null}
                  setQuoteCurrency={null}
                  mintInfo={mintInfo}
                  currentPrice={currentPrice}
                  strategy={null}
                  onShowModalSuccess={null}
                  position={position}
                  pair={pair}
                  handleBack={null}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Section */}
      <div className='order-3 xl:hidden'>
        {viewMode ? (
          <AddLiquidityCLPane
            baseCurrency={currencyA}
            quoteCurrency={currencyB}
            setBaseCurrency={null}
            setQuoteCurrency={null}
            mintInfo={mintInfo}
            currentPrice={currentPrice}
            strategy={null}
            onShowModalSuccess={null}
            position={position}
            pair={pair}
            handleBack={null}
          />
        ) : (
          <PresetRangesComponent isMobile className='mt-auto' />
        )}
      </div>
    </div>
  )
}
