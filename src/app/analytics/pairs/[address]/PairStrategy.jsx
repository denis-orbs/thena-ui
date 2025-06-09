'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { defaultSwapFees } from '@/components/common/AddLiquidity/ChooseStrategy'
import { PresetRanges } from '@/components/common/AddLiquidity/components/PresetRange'
import AutomaticStrategy from '@/components/common/AddLiquidity/FusionAdd/AutomaticStrategy'
import ChartPriceRangeInput from '@/components/common/AddLiquidity/FusionAdd/LiquidityChartRangeInput/ChartPriceRangeInput'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import { NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { ICHI_TYPES, MANUAL_TYPES, NARROW_TYPES } from '@/constant'
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
import { ArrowRightIcon } from '@/svgs'

const feeAmount = 3000

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
    const stablecoins = stableAssets.map(token => token.address)
    return stablecoins.includes(baseCurrency?.wrapped?.address) && stablecoins.includes(quoteCurrency?.wrapped?.address)
  }, [baseCurrency, quoteCurrency, stableAssets])

  const sortedSubPools = useMemo(() => {
    const priority = { CL_Farming: 1, CL_SwapFee: 2, ICHI_Farming: 3, Narrow_Farming: 4, Wide_Farming: 5 }
    return (pair?.subpools || []).sort((a, b) => (priority[a.title] || 6) - (priority[b.title] || 6))
  }, [pair?.subpools])

  const strategyAutoData = useMemo(() => {
    const autoStrategy = sortedSubPools
      .filter(item => !MANUAL_TYPES.includes(item.title))
      .map(sub => ({
        content: (
          <div className='flex flex-1 items-center justify-between'>
            <div>
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
      onLeftRangeInput('')
      onRightRangeInput('')
      dispatch(updateStrategy({ strategy: strategyInfo }))
      onChangeLiquidityRangeType(getLiquidityRangeType(strategyInfo?.title))
    },
    [dispatch, onChangeLiquidityRangeType, onLeftRangeInput, onRightRangeInput],
  )

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
    handleChooseStrategy(bestManualPool)
  }, [bestManualPool, handleChooseStrategy])

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
  })

  const estimateAPRs = useMemo(() => {
    if (Object.values(estimateAPR).every(apr => Number(apr) === 0)) return '0%'
    return `${formatAmount(estimateAPR[Presets.FULL], true)} ~ ${formatAmount(estimateAPR[Presets.RISK], true)}%`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(estimateAPR)])

  useEffect(() => {
    setAPRs(estimateAPR)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(estimateAPR), setAPRs])

  useEffect(() => {
    const _strategy = sortedSubPools.find(item => MANUAL_TYPES.includes(item.title))
    handleChooseStrategy(_strategy ?? defaultSwapFees)
  }, [handleChooseStrategy, sortedSubPools])

  return (
    <div className='flex gap-8 max-2xl:flex-col max-2xl:gap-4'>
      <div className='w-full 2xl:w-[25%]'>
        <div className={cn('flex items-center justify-between py-4 lg:h-[92px]')}>
          <NewTextSubHeading className='text-primary-100 text-xs font-bold md:text-xl'>
            Automatic Strategy
          </NewTextSubHeading>

          <EmphasisIconButton
            Icon={ArrowRightIcon}
            className='size-8 bg-neutral-700 lg:size-11 [&>svg]:size-4 lg:[&>svg]:size-5 [&>svg>path]:stroke-neutral-400'
            onClick={() => handleAddLiquidity('automatic')}
          />
        </div>

        {strategyAutoData && (
          <AutomaticStrategy
            canSelect={false}
            strategyAutoData={strategyAutoData}
            classNames={{ item: 'md:px-4 bg-neutral-900' }}
            isGrid={false}
          />
        )}
      </div>

      <div className='flex w-full flex-col gap-8 2xl:w-[75%]'>
        <div className={cn('bg-primary-950/50 flex items-center justify-between gap-2 rounded-xl p-4 lg:px-6')}>
          <div className='flex items-center gap-4 lg:gap-8'>
            <NewTextSubHeading className='text-primary-100 text-xs font-bold md:text-xl'>
              Manual Strategy
            </NewTextSubHeading>
            <EmphasisIconButton
              Icon={ArrowRightIcon}
              className='size-8 bg-neutral-700 lg:size-11 [&>svg]:size-4 lg:[&>svg]:size-5 [&>svg>path]:stroke-neutral-400'
              onClick={() => handleAddLiquidity('manual')}
            />
          </div>

          <div className='flex flex-col justify-end'>
            <Paragraph className='text-sm leading-5 font-bold text-neutral-500 md:text-lg'>
              {t('Estimated APR')}
            </Paragraph>
            <NewTextSubHeading className='text-primary-600 text-base lg:text-3xl'>{estimateAPRs}</NewTextSubHeading>
          </div>
        </div>

        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2 lg:gap-8'>
            <ChartPriceRangeInput
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
              }}
              handleShow
              isCreate={false}
              label='Your Range against the Price'
            />

            <div className='mt-11 md:mt-4'>
              <PresetRanges
                mintInfo={mintInfo}
                isStablecoinPair={isStablecoinPair}
                activePreset={activePreset}
                handlePresetRangeSelection={handlePresetRangeSelection}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PairStrategy
