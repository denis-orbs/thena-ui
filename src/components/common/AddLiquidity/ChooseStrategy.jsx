'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'

import { NeutralBadge, PrimaryBadge } from '@/components/badges/Badge'
import { EmphasisButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Selection from '@/components/selection'
import Selector from '@/components/selector'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { FusionRangeType, GAMMA_TYPES } from '@/constant'
import { ichiVaultAbi } from '@/constant/abi/fusion'
import { useFusionPairs } from '@/context/fusionsContext'
import { usePairs } from '@/context/pairsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { callMulti } from '@/lib/contractActions'
import { cn, formatAmount, unwrappedSymbol, wrappedAddress } from '@/lib/utils'
import { Bound, setInitialTokenPrice, updateSelectedPreset } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoCircleWhite, InfoIcon } from '@/svgs'

import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import LiquidityChartRangeInput from './FusionAdd/LiquidityChartRangeInput'
import ManualStrategy from './FusionAdd/ManualStrategy'

const feeAmount = 3000

const fetchIchiInfo = async (chainId, strategy) => {
  const values = await callMulti([
    {
      address: strategy.address,
      abi: ichiVaultAbi,
      functionName: 'baseLower',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: ichiVaultAbi,
      functionName: 'baseUpper',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: ichiVaultAbi,
      functionName: 'currentTick',
      args: [],
      chainId,
    },
  ])
  const lowerValue = 1.0001 ** Number(values[0] - values[2])
  const upperValue = 1.0001 ** Number(values[1] - values[2])
  return {
    type: strategy.title,
    title: strategy.title,
    address: strategy.address,
    min: lowerValue,
    max: upperValue,
  }
}

const fetchStrategyInfo = async (chainId, strategy, currentTick) => {
  let preset
  if (GAMMA_TYPES.includes(strategy.title)) {
    preset = await fetchGammaInfo(chainId, strategy)
  } else if (strategy.title === 'DefiEdge') {
    preset = await fetchDefiedgeInfo(chainId, strategy, currentTick)
  } else if (strategy.title === 'ICHI') {
    preset = await fetchIchiInfo(chainId, strategy, currentTick)
  }
  return preset
}

export default function ChooseStrategy({
  pairType,
  firstAsset,
  secondAsset,
  setCurrentStep,
  strategy,
  setStrategy,
  isAutomatic,
  setIsAutomatic,
  isReverse,
  setIsReverse,
  isModal,
}) {
  const { pairs } = usePairs()
  const fusionPairs = useFusionPairs()
  const t = useTranslations()

  const pair = useMemo(() => {
    const found = (pairs ?? []).find(
      ele =>
        [ele.token0.address, ele.token1.address].includes(wrappedAddress(firstAsset)) &&
        [ele.token0.address, ele.token1.address].includes(wrappedAddress(secondAsset)) &&
        pairType === ele.type,
    )
    if (!found) return
    const pool = (fusionPairs ?? []).find(ele => found.address.toLowerCase() === ele.address)
    return {
      ...found,
      currentTick: Number(pool?.globalState.tick || 0),
    }
  }, [pairs, fusionPairs, firstAsset, secondAsset, pairType])

  const dispatch = useDispatch()
  const { networkId } = useChainSettings()
  const { data: preset } = useSWR(
    strategy && pair && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy, pair.currentTick),
    {
      refreshInterval: 0,
    },
  )
  const baseCurrency = useCurrency(firstAsset ? firstAsset.address : undefined)
  const quoteCurrency = useCurrency(secondAsset ? secondAsset.address : undefined)
  const mintInfo = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    undefined,
  )
  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onStartPriceInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const price = useMemo(() => {
    if (!mintInfo.price) return

    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo])

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

  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])

  useEffect(() => {
    if (!price) return

    dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))

    onLeftRangeInput(preset ? String(+price * preset.min) : '')
    onRightRangeInput(preset ? String(+price * preset.max) : '')
    onChangePresetRange(preset)
    if (strategy) {
      onChangeLiquidityRangeType(
        GAMMA_TYPES.includes(strategy.title)
          ? FusionRangeType.GAMMA_RANGE
          : strategy.title === 'DefiEdge'
            ? FusionRangeType.DEFIEDGE_RANGE
            : FusionRangeType.ICHI_RANGE,
      )
    }
  }, [
    preset,
    strategy,
    dispatch,
    onChangePresetRange,
    onLeftRangeInput,
    onRightRangeInput,
    onChangeLiquidityRangeType,
    price,
  ])

  const strategyData = useMemo(() => {
    if (!pair || !pair.subpools.length) return null
    return pair.subpools.map(sub => ({
      content: (
        <div className='flex flex-1 items-center justify-between'>
          <div>
            <TextHeading>{GAMMA_TYPES.includes(sub.title) ? 'Gamma' : sub.title}</TextHeading>
            <div className='mt-1 flex gap-2'>
              <div className='flex items-center gap-1'>
                <TextHeading className='text-sm'>{t('APR')}:</TextHeading>
                <Paragraph className='text-sm'>{formatAmount(sub.gauge.apr)}%</Paragraph>
              </div>
              <div className='flex items-center gap-1'>
                <TextHeading className='text-sm'>{t('TVL')}:</TextHeading>
                <Paragraph className='text-sm'>${formatAmount(sub.gauge.tvl)}</Paragraph>
              </div>
            </div>
          </div>
          {GAMMA_TYPES.includes(sub.title) &&
            (strategy?.address === sub.address ? (
              <PrimaryBadge>{sub.title}</PrimaryBadge>
            ) : (
              <NeutralBadge>{sub.title}</NeutralBadge>
            ))}
          {sub.title === 'ICHI' &&
            (strategy?.address === sub.address ? (
              <PrimaryBadge>
                {sub.allowed.symbol} {t('Deposit')}
              </PrimaryBadge>
            ) : (
              <NeutralBadge>
                {sub.allowed.symbol} {t('Deposit')}
              </NeutralBadge>
            ))}
        </div>
      ),
      active: strategy?.address === sub.address,
      onClickHandler: () => {
        setStrategy(sub)
      },
    }))
  }, [pair, strategy, setStrategy, t])

  const autoSelections = useMemo(
    () => [
      {
        label: 'Automatic',
        active: isAutomatic,
        onClickHandler: () => {
          setIsAutomatic(true)
          setStrategy(null)
          dispatch(updateSelectedPreset({ preset: null }))
          dispatch(setInitialTokenPrice({ typedValue: '' }))
          onStartPriceInput('')
          onLeftRangeInput('')
          onRightRangeInput('')
        },
      },
      {
        label: 'Manual',
        active: !isAutomatic,
        onClickHandler: () => {
          setIsAutomatic(false)
          dispatch(updateSelectedPreset({ preset: null }))
          dispatch(setInitialTokenPrice({ typedValue: '' }))
          onStartPriceInput('')
          onLeftRangeInput('')
          onRightRangeInput('')
          onChangeLiquidityRangeType(FusionRangeType.MANUAL_RANGE)
        },
      },
    ],
    [
      isAutomatic,
      setIsAutomatic,
      dispatch,
      onLeftRangeInput,
      onRightRangeInput,
      onStartPriceInput,
      onChangeLiquidityRangeType,
      setStrategy,
    ],
  )

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Management')}</TextHeading>
              <InfoIcon className='h-4 w-4 cursor-pointer stroke-neutral-400' data-tooltip-id='management-tooltip' />
            </div>
            <Selection data={autoSelections} isFull />
          </div>
          {isAutomatic ? (
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-3'>
                <TextHeading>{t('Strategy')}</TextHeading>
                {strategyData ? (
                  <Selector data={strategyData} selected={strategy} setSelected={setStrategy} />
                ) : (
                  <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[60px]'>
                    <Highlight>
                      <InfoCircleWhite className='h-4 w-4' />
                    </Highlight>
                    <div className='flex flex-col items-center gap-3'>
                      <h2>{t('No strategy found')}</h2>
                    </div>
                  </div>
                )}
              </div>
              {!mintInfo.noLiquidity && strategyData && (
                <>
                  <div className='-mb-2 flex items-center justify-center'>
                    <TextHeading className='text-sm'>
                      {t('Current Price: [price] [symbolA] [symbolB]', {
                        price: currentPrice,
                        symbolA: unwrappedSymbol(quoteCurrency),
                        symbolB: unwrappedSymbol(baseCurrency),
                      })}
                    </TextHeading>
                  </div>
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
                    interactive={false}
                    handleShow={!!strategy}
                  />
                </>
              )}
            </div>
          ) : (
            <ManualStrategy
              firstAsset={firstAsset}
              secondAsset={secondAsset}
              isReverse={isReverse}
              setIsReverse={setIsReverse}
            />
          )}
        </div>
      </div>
      {isAutomatic && (
        <div className={cn('mt-auto inline-flex w-full flex-col pt-5', isModal && 'px-3 pt-3 lg:px-6')}>
          <EmphasisButton
            disabled={!strategy}
            onClick={() => {
              setCurrentStep(2)
            }}
          >
            {t('Continue')}
          </EmphasisButton>
        </div>
      )}
      <CustomTooltip id='management-tooltip' className='max-w-[320px]'>
        <div className='flex flex-col gap-2'>
          <TextHeading className='text-sm'>{t('How to Choose a Strategy')}</TextHeading>
          <Paragraph className='text-xs'>{t('Automatic Strategy')}</Paragraph>
          <Paragraph className='text-xs'>{t('Manual Strategy')}</Paragraph>
        </div>
      </CustomTooltip>
    </>
  )
}
