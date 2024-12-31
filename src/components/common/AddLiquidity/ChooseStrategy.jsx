'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR from 'swr'

import { NeutralBadge, PrimaryBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Selector from '@/components/selector'
import Tabs from '@/components/tabs'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { FusionRangeType, GAMMA_TYPES } from '@/constant'
import { ichiVaultAbi } from '@/constant/abi/fusion'
import { useFusionPairs } from '@/context/fusionsContext'
import { usePairs } from '@/context/pairsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { callMulti } from '@/lib/contractActions'
import { cn, formatAmount, unwrappedSymbol, wrappedAddress } from '@/lib/utils'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import PoolChart from '@/modules/SwapChart/PoolChart'
import { Bound, updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings, useLocaleSettings } from '@/state/settings/hooks'
import { InfoCircleWhite } from '@/svgs'

import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import LiquidityChartRangeInput from './FusionAdd/LiquidityChartRangeInput'
import ManualStrategy from './FusionAdd/ManualStrategy'

const feeAmount = 3000

export const strategiesManual = {
  type: 'manual',
  title: 'Swap Fees',
  address: 'manual-swap-fees',
  description: '80% Fees',
  min: 100,
  max: 150,
}

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
  pool,
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
  const dispatch = useDispatch()
  const { networkId } = useChainSettings()
  const { pairs } = usePairs()
  const fusionPairs = useFusionPairs()
  const t = useTranslations()
  const fusion = useSelector(state => state.fusion)

  const { locale } = useLocaleSettings()
  const [timeWindow, setTimeWindow] = useState(PairDataTimeWindow.YEAR)

  const pair = useMemo(() => {
    const found = (pairs ?? []).find(
      ele =>
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(firstAsset)) &&
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(secondAsset)) &&
        pairType === ele.type,
    )
    if (!found) return
    const fusionPool = (fusionPairs ?? []).find(ele => found.address.toLowerCase() === ele.address)
    return {
      ...found,
      currentTick: Number(fusionPool?.globalState.tick || 0),
    }
  }, [pairs, fusionPairs, firstAsset, secondAsset, pairType])

  const { data: preset } = useSWR(
    strategy && pair && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy, pair.currentTick),
    {
      refreshInterval: 0,
    },
  )
  const baseCurrency = useCurrency(firstAsset?.address)
  const quoteCurrency = useCurrency(secondAsset?.address)
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined, 3)

  const { data: pairPrices = [], error } = useFetchPairPrices({
    token0Address: wrappedAddress(pair?.token0),
    token1Address: wrappedAddress(pair?.token1),
    timeWindow,
  })

  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
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
  const isSorted = baseCurrency?.wrapped.sortsBefore(quoteCurrency?.wrapped)

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
    const autoStrategy = (pair?.subpools || []).map(sub => {
      let { title } = sub
      if (title === 'CL_Farming') title = 'Manual ($THE Emissions)'
      else if (GAMMA_TYPES.includes(sub.title)) title = 'Gamma'

      return {
        content: (
          <div className='flex flex-1 items-center justify-between'>
            <div>
              <TextHeading>{title}</TextHeading>

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

            {sub.title === 'CL_Farming' && <NeutralBadge>$THE + 10% Fees</NeutralBadge>}
          </div>
        ),
        active: strategy?.address === sub.address,
        onClickHandler: () => {
          setStrategy({
            ...sub,
            type: sub.title === 'CL_Farming' ? 'manual' : 'auto',
            isFarming: sub.title === 'CL_Farming',
          })
        },
      }
    })

    const manualStrategy = [
      {
        content: (
          <div className='flex flex-1 items-center justify-between'>
            <div>
              <TextHeading>Manual ({strategiesManual?.title})</TextHeading>
              <div className='mt-1 flex gap-2'>
                <div className='flex items-center gap-1'>
                  <TextHeading className='text-sm'>{t('TVL')}:</TextHeading>
                  <Paragraph className='text-sm'>${formatAmount(pool.tvlPoolFee || 0)}</Paragraph>
                </div>
              </div>
            </div>
            <NeutralBadge>{strategiesManual.description}</NeutralBadge>
          </div>
        ),
        active: strategy?.address === strategiesManual.address,
        onClickHandler: () => {
          setStrategy(strategiesManual)
        },
      },
    ]

    return [...autoStrategy, ...manualStrategy]
  }, [pair?.subpools, t, pool, strategy?.address, setStrategy])

  const periods = useMemo(
    () => [
      {
        label: '24H',
        active: timeWindow === PairDataTimeWindow.DAY,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.DAY)
        },
      },
      {
        label: '1W',
        active: timeWindow === PairDataTimeWindow.WEEK,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.WEEK)
        },
      },
      {
        label: '1M',
        active: timeWindow === PairDataTimeWindow.MONTH,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.MONTH)
        },
      },
      {
        label: '1Y',
        active: timeWindow === PairDataTimeWindow.YEAR,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.YEAR)
        },
      },
    ],
    [timeWindow],
  )

  useEffect(() => {
    if (strategy?.type === 'manual') {
      setIsAutomatic(false)
      dispatch(updateStrategy({ strategy }))
      // dispatch(updateSelectedPreset({ preset: null }))
      // dispatch(setInitialTokenPrice({ typedValue: '' }))
      // onStartPriceInput('')
      // onLeftRangeInput('')
      // onRightRangeInput('')
      // onChangeLiquidityRangeType(FusionRangeType.MANUAL_RANGE)
    } else {
      setIsAutomatic(true)
      dispatch(updateStrategy({ strategy }))
      // dispatch(updateSelectedPreset({ preset: null }))
      // dispatch(setInitialTokenPrice({ typedValue: '' }))
      // onStartPriceInput('')
      // onLeftRangeInput('')
      // onRightRangeInput('')
    }
  }, [dispatch, setIsAutomatic, strategy])

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        <div className='flex flex-col gap-5'>
          {/* <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Management')}</TextHeading>
              <InfoIcon className='h-4 w-4 cursor-pointer stroke-neutral-400' data-tooltip-id='management-tooltip' />
            </div>
            <Selection data={autoSelections} isFull isTranslation={false} />
          </div> */}

          {/* {isAutomatic ? (
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

              <Box className={cn('hidden', priceLower && priceUpper && 'block')}>
                <div className='flex flex-col items-start gap-2 lg:flex-row lg:justify-between'>
                  <h6 className='font-bold'>Historical price</h6>
                  <Tabs data={periods} />
                </div>

                <div className='mt-2 flex h-[250px] items-center justify-center'>
                  {error ? (
                    <Paragraph>Failed to load price chart for this pair</Paragraph>
                  ) : (
                    <PoolChart
                      data={pairPrices}
                      timeWindow={timeWindow}
                      locale={locale}
                      upper={
                        isSorted
                          ? Number(priceLower?.invert()?.toSignificant(6))
                          : Number(priceUpper?.invert()?.toSignificant(6))
                      }
                      current={Number(currentPrice)}
                      lower={
                        isSorted
                          ? Number(priceUpper?.invert()?.toSignificant(6))
                          : Number(priceLower?.invert()?.toSignificant(6))
                      }
                    />
                  )}
                </div>
              </Box>
            </div>
          ) : (
            <ManualStrategy
              firstAsset={firstAsset}
              secondAsset={secondAsset}
              isReverse={isReverse}
              setIsReverse={setIsReverse}
            />
          )} */}

          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-3'>
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

            {isAutomatic && strategy && (
              <>
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

                <Box className={cn('hidden', priceLower && priceUpper && 'block')}>
                  <div className='flex flex-col items-start gap-2 lg:flex-row lg:justify-between'>
                    <h6 className='font-bold'>Historical price</h6>
                    <Tabs data={periods} />
                  </div>

                  <div className='mt-2 flex h-[250px] items-center justify-center'>
                    {error ? (
                      <Paragraph>Failed to load price chart for this pair</Paragraph>
                    ) : (
                      <PoolChart
                        data={pairPrices}
                        timeWindow={timeWindow}
                        locale={locale}
                        upper={
                          isSorted
                            ? Number(priceLower?.invert()?.toSignificant(6))
                            : Number(priceUpper?.invert()?.toSignificant(6))
                        }
                        current={Number(currentPrice)}
                        lower={
                          isSorted
                            ? Number(priceUpper?.invert()?.toSignificant(6))
                            : Number(priceLower?.invert()?.toSignificant(6))
                        }
                      />
                    )}
                  </div>
                </Box>
              </>
            )}
          </div>

          {!isAutomatic && (
            <ManualStrategy
              firstAsset={firstAsset}
              secondAsset={secondAsset}
              isReverse={isReverse}
              setIsReverse={setIsReverse}
            />
          )}
        </div>
      </div>

      <div className={cn('mt-auto inline-flex w-full flex-col pt-5', isModal && 'px-3 pt-3 lg:px-6')}>
        <PrimaryButton
          disabled={(!strategy && isAutomatic) || (!fusion.preset && !isAutomatic)}
          onClick={() => {
            setCurrentStep(2)
          }}
        >
          {t('Continue')}
        </PrimaryButton>
      </div>

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
