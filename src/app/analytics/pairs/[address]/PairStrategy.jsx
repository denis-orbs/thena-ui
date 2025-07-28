'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Collapsible from '@/components/collapse/Collapse2'
import { defaultSwapFees } from '@/components/common/AddLiquidity/ChooseStrategy'
import { PresetRanges } from '@/components/common/AddLiquidity/components/PresetRange'
import AutomaticStrategy from '@/components/common/AddLiquidity/FusionAdd/AutomaticStrategy'
import ChartPriceRangeInput from '@/components/common/AddLiquidity/FusionAdd/LiquidityChartRangeInput/ChartPriceRangeInput'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { ICHI_TYPES, MANUAL_TYPES, NARROW_TYPES, STABLE_PAIRS } from '@/constant'
import { useCurrency, useStableTokens } from '@/hooks/fusion/Tokens'
import { useEstimateAPR } from '@/hooks/fusion/useEstimateAPR'
import { cn, formatAmount, getDisplayedStrategy, getLiquidityRangeType } from '@/lib/utils'
import { useAprStore } from '@/state/APR/store'
import { Bound, updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import {
  useActivePreset,
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
} from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'

const feeAmount = 3000

function getAprRange(pools) {
  const validPools = pools.filter(item => !MANUAL_TYPES.includes(item.title))

  if (validPools.length === 0) {
    return { max: null, min: null }
  }

  let max = -Infinity
  let min = Infinity

  validPools.forEach(sub => {
    const apr = sub.gauge?.apr ?? 0
    if (apr > max) max = apr
    if (apr < min) min = apr
  })

  return { max, min }
}

function PairStrategy({ pair }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const { push } = useRouter()
  const { setAPRs } = useAprStore()

  const stableAssets = useStableTokens()
  const activePreset = useActivePreset()
  const baseCurrency = useCurrency(pair?.token0?.address)
  const quoteCurrency = useCurrency(pair?.token1?.address)

  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)
  const { onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } = useV3MintActionHandlers(
    mintInfo.noLiquidity,
  )

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])

  const { getSetFullRange } = useRangeHopCallbacks(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    mintInfo.dynamicFee,
    tickLower,
    tickUpper,
    mintInfo.pool,
    mintInfo.tickSpacing,
  )

  const price = useMemo(() => {
    if (!mintInfo.price) return
    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo.invertPrice, mintInfo.price])

  const isStablecoinPair = useMemo(() => {
    if (STABLE_PAIRS.includes(pair?.address?.toLowerCase())) return true
    const stableCoins = stableAssets.map(token => token.address)
    return stableCoins.includes(baseCurrency?.wrapped?.address) && stableCoins.includes(quoteCurrency?.wrapped?.address)
  }, [baseCurrency, pair?.address, quoteCurrency, stableAssets])

  const sortedSubPools = useMemo(() => {
    const priority = { CL_Farming: 1, CL_SwapFee: 2, ICHI_Farming: 3, Narrow_Farming: 4, Wide_Farming: 5 }
    return (pair?.subpools || []).sort((a, b) => (priority[a.title] || 6) - (priority[b.title] || 6))
  }, [pair?.subpools])

  const strategyAutoData = useMemo(() => {
    const autoStrategy = sortedSubPools
      .filter(item => !MANUAL_TYPES.includes(item.title))
      .map(sub => ({
        content: (
          <div className='grid flex-1 grid-cols-4 items-center justify-between'>
            <div className='col-span-2'>
              <TextHeading className='text-sm lg:text-base'>{getDisplayedStrategy(sub.title, sub.version)}</TextHeading>
              <div className='mt-1 flex flex-wrap gap-2'>
                <div className='flex items-center gap-1'>
                  <TextHeading className='text-sm text-neutral-400'>{t('TVL')}:</TextHeading>
                  <Paragraph className='text-sm!'>${formatAmount(sub.tvl ?? sub.gauge.tvl)}</Paragraph>
                </div>
              </div>
            </div>

            <TextHeading className='font-archia text-primary-600 text-xl font-semibold'>
              {formatAmount(sub.gauge.apr, true)}%
            </TextHeading>

            <div className='flex flex-wrap justify-end gap-2'>
              {ICHI_TYPES.includes(sub.title) && (
                <div className='flex flex-col items-center gap-1'>
                  <CircleImage alt={sub.title} className='size-6' src={sub.allowed.logoURI} />
                  <Paragraph className='text-sm! text-neutral-400'>{t('Deposit')}</Paragraph>
                </div>
              )}
              {NARROW_TYPES.includes(sub.title) && (
                <div className='flex flex-col items-center gap-1'>
                  <IconGroup
                    className='*:not-first:-ml-2'
                    classNames={{
                      image: 'outline-2 size-6',
                    }}
                    logo1={sub.token0.logoURI}
                    logo2={sub.token1.logoURI}
                  />
                  <Paragraph className='text-sm!'>{t('Deposit')}</Paragraph>
                </div>
              )}
            </div>
          </div>
        ),
      }))

    return autoStrategy
  }, [sortedSubPools, t])

  const handlePresetRangeSelection = useCallback(
    preset => {
      if (!price) return

      dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))

      if (preset && preset.type === Presets.FULL) {
        getSetFullRange()
      } else {
        onLeftRangeInput(preset ? String(+price * preset.min) : '')
        onRightRangeInput(preset ? String(+price * preset.max) : '')
      }
    },
    [dispatch, getSetFullRange, onLeftRangeInput, onRightRangeInput, price],
  )

  const setStrategy = useCallback(
    strategyInfo => {
      dispatch(updateStrategy({ strategy: strategyInfo }))
      onChangeLiquidityRangeType(getLiquidityRangeType(strategyInfo?.title))
    },
    [dispatch, onChangeLiquidityRangeType],
  )

  useEffect(() => {
    onLeftRangeInput('')
    onRightRangeInput('')
    dispatch(updateSelectedPreset({ preset: null }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChooseStrategy = useCallback(
    sub => {
      if (!sub) return setStrategy(null)
      const _isAutomatic = !MANUAL_TYPES.includes(sub.title)
      setStrategy({
        title: sub.title,
        tvl: sub.tvl?.toNumber() ?? 0,
        apr: sub.gauge?.apr?.toNumber() ?? 0,
        account: {
          totalLp: sub.account?.totalLp?.toNumber(),
          gaugeBalance: sub.account?.gaugeBalance?.toNumber(),
        },
        allowed: sub.allowed,
        token0: {
          ...sub.token0,
          reserve: sub.token0?.reserve?.toNumber(),
          balance: sub.token0?.balance?.toNumber(),
          totalValue: sub.token0?.totalValue,
        },
        token1: {
          ...sub.token1,
          reserve: sub.token1?.reserve?.toNumber(),
          balance: sub.token1?.balance?.toNumber(),
          totalValue: sub.token1?.totalValue,
        },
        address: sub.address,
        isFarming: sub.title.includes('Farming'),
        isAutomatic: _isAutomatic,
        isDefault: sub.isDefault ?? true,
        version: 3,
        fee: sub.fee,
      })
    },
    [setStrategy],
  )

  const handleAddLiquidity = useCallback(
    strategyType => {
      const _strategy = sortedSubPools.find(item =>
        strategyType === 'manual' ? MANUAL_TYPES.includes(item.title) : !MANUAL_TYPES.includes(item.title),
      )
      handleChooseStrategy(_strategy ?? defaultSwapFees)
      push(`/pools/add-liquidity?step=3&poolAddress=${pair.address}&back=4`)
    },
    [handleChooseStrategy, pair.address, push, sortedSubPools],
  )

  const bestManualPool = useMemo(() => {
    if (!pair?.subpools) return null
    return pair.subpools
      .filter(sub => MANUAL_TYPES.includes(sub.title))
      .sort((a, b) => b.gauge.apr.toNumber() - a.gauge.apr.toNumber())[0]
  }, [pair])

  useEffect(() => {
    // Only set best manual pool if no strategy is currently selected
    if (!mintInfo.strategy && bestManualPool) {
      handleChooseStrategy(bestManualPool)
    }
  }, [bestManualPool, handleChooseStrategy, mintInfo.strategy])

  const { strategy, pool, poolAddress } = mintInfo

  const estimateAPR = useEstimateAPR({
    pool,
    poolAddress: poolAddress?.toLowerCase(),
    token0: baseCurrency,
    token1: quoteCurrency,
    tickLower,
    tickUpper,
    isFarming: strategy?.isFarming,
    tickSpacing: mintInfo.tickSpacing,
    isStablecoinPair,
    currentPrice: price,
    invertPrice: mintInfo.invertPrice,
  })

  const estimateAPRs = useMemo(() => {
    if (Object.values(estimateAPR).every(apr => Number(apr) === 0)) return '0%'
    if (isStablecoinPair) return `${formatAmount(estimateAPR[Presets.STABLE], true)}%`
    return `${formatAmount(estimateAPR[Presets.FULL], true)} ~ ${formatAmount(estimateAPR[Presets.RISK], true)}%`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(estimateAPR), isStablecoinPair])

  useEffect(() => {
    setAPRs(estimateAPR)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(estimateAPR), setAPRs])

  useEffect(() => {
    // Only set default strategy if no strategy is currently selected
    if (!mintInfo.strategy) {
      const _strategy = sortedSubPools.find(item => MANUAL_TYPES.includes(item.title))
      handleChooseStrategy(_strategy ?? defaultSwapFees)
    }
  }, [handleChooseStrategy, sortedSubPools, mintInfo.strategy])

  return (
    <div className='flex gap-4 max-lg:flex-col'>
      <div className='rounded-xl bg-neutral-900 p-4 max-lg:hidden lg:w-[35%] xl:w-[30%]'>
        <div className={cn('mb-4 flex items-center justify-between')}>
          <TextHeading className='text-primary-100 text-xl font-medium lg:text-2xl'>
            {t('Automatic Strategy')}
          </TextHeading>

          <EmphasisButton className='hidden lg:block' onClick={() => handleAddLiquidity('automatic')}>
            {t('View')}
          </EmphasisButton>
        </div>

        {strategyAutoData && (
          <AutomaticStrategy
            className='divide-y-1 divide-neutral-700'
            canSelect={false}
            strategyAutoData={strategyAutoData}
            classNames={{ item: 'bg-transparent hover:bg-transparent rounded-none px-0 h-[87px]!' }}
            isGrid={false}
          />
        )}
      </div>

      <Collapsible
        previewContent={
          <div className='h-[143px] w-full overflow-hidden bg-[url("/images/range-chart.png")] bg-[length:100%_122px] bg-center bg-no-repeat' />
        }
        title={
          <div className='flex flex-col gap-1'>
            <TextHeading className='text-primary-600 font-archia text-xl! leading-6! font-semibold'>
              {estimateAPRs}
            </TextHeading>
            <TextHeading className='font-archia text-xl! leading-6! font-semibold'>{t('Manual Strategy')}</TextHeading>
          </div>
        }
        subtitle={`${t('Full Range')} / ${t('Broad')} / ${t('Moderate')} / ${t('Tight')}`}
        className={cn('relative lg:hidden', !strategyAutoData && 'hidden')}
        classNames={{ content: 'pb-0 bg-neutral-950 pt-2 gap-4 flex flex-col', preview: '!p-0' }}
      >
        <div className='flex flex-col gap-2 px-0'>
          <ChartPriceRangeInput
            maskColor='#0d090f'
            currencyA={baseCurrency ?? undefined}
            currencyB={quoteCurrency ?? undefined}
            feeAmount={mintInfo.dynamicFee}
            ticksAtLimit={mintInfo.ticksAtLimit}
            price={price ? parseFloat(price) : undefined}
            priceLower={priceLower}
            priceUpper={priceUpper}
            onLeftRangeInput={onLeftRangeInput}
            onRightRangeInput={onRightRangeInput}
            interactive={false}
            showPeriod
            idChart='mobile-chart-price-range'
            classNames={{
              periods: 'md:justify-end justify-start md:-mt-12 -mb-11 md:mb-4 max-md:max-w-[70%] z-40',
              title: 'px-4',
              actions: 'px-4',
            }}
            handleShow
            isCreate={false}
            label='Your Range against the Price'
          />

          <div className='z-40 mt-2 px-2'>
            <PresetRanges
              mintInfo={mintInfo}
              isStablecoinPair={isStablecoinPair}
              activePreset={activePreset}
              handlePresetRangeSelection={handlePresetRangeSelection}
              className='bg-transparent!'
            />
          </div>
        </div>
        <PrimaryButton className='z-40 h-8 w-full rounded-md text-xs!' onClick={() => handleAddLiquidity('manual')}>
          {t('Deposit')}
        </PrimaryButton>
      </Collapsible>

      <Collapsible
        className={cn('lg:hidden', !strategyAutoData && 'hidden')}
        classNames={{ content: 'pb-4', subtitle: 'pt-1' }}
        title={
          <div className='flex flex-col gap-1'>
            <TextSubHeading className='text-primary-600 font-archia text-xl! leading-6! font-semibold'>
              {getAprRange(sortedSubPools).max !== getAprRange(sortedSubPools).min
                ? `${formatAmount(getAprRange(sortedSubPools).min)}% - ${formatAmount(
                    getAprRange(sortedSubPools).max,
                  )}%`
                : `${formatAmount(getAprRange(sortedSubPools).min)}%`}
            </TextSubHeading>
            <TextHeading className='font-archia text-xl! leading-6! font-semibold text-neutral-50'>
              {t('Automatic Strategy')}
            </TextHeading>
          </div>
        }
        subtitle={t('ICHI / GAMA / Single Sided')}
      >
        <AutomaticStrategy
          className='divide-y-1 divide-neutral-700'
          canSelect={false}
          strategyAutoData={strategyAutoData}
          classNames={{ item: 'bg-transparent hover:bg-transparent rounded-none mx-4 px-0' }}
          isGrid={false}
        />
      </Collapsible>

      <div className='hidden w-full flex-col gap-4 rounded-xl bg-neutral-900 p-4 lg:flex lg:w-[65%] xl:w-[70%]'>
        <div className={cn('flex items-start justify-between gap-2 bg-neutral-900')}>
          <div className='flex items-start gap-4 lg:gap-8'>
            <TextHeading className='text-xl! leading-6! font-medium lg:text-2xl! lg:leading-8!'>
              {t('Manual Strategy')}
            </TextHeading>
          </div>

          <div className='flex flex-row items-start gap-8'>
            <div className='flex flex-col gap-2.5'>
              <TextHeading className='text-primary-600 font-archia text-xl! font-semibold'>{estimateAPRs}</TextHeading>
              <Paragraph className='w-full text-right text-sm font-normal text-neutral-400'>
                {t('Estimated APR')}
              </Paragraph>
            </div>
            <EmphasisButton className='hidden lg:block' onClick={() => handleAddLiquidity('manual')}>
              {t('Add Liquidity')}
            </EmphasisButton>
          </div>
        </div>
        <div className='flex flex-col'>
          <ChartPriceRangeInput
            maskColor='#1A121E'
            currencyA={baseCurrency ?? undefined}
            currencyB={quoteCurrency ?? undefined}
            feeAmount={mintInfo.dynamicFee}
            ticksAtLimit={mintInfo.ticksAtLimit}
            price={price ? parseFloat(price) : undefined}
            priceLower={priceLower}
            priceUpper={priceUpper}
            onLeftRangeInput={onLeftRangeInput}
            onRightRangeInput={onRightRangeInput}
            interactive={false}
            showPeriod
            classNames={{
              periods: 'md:justify-end justify-start md:-mt-12 -mb-11 md:mb-4 max-md:max-w-[70%] z-40',
              chart: 'lg:h-[265px]',
            }}
            handleShow
            isCreate={false}
            label='Your Range against the Price'
          />

          <div className='z-40 mt-4'>
            <PresetRanges
              mintInfo={mintInfo}
              isStablecoinPair={isStablecoinPair}
              activePreset={activePreset}
              handlePresetRangeSelection={handlePresetRangeSelection}
              className='bg-transparent!'
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PairStrategy
