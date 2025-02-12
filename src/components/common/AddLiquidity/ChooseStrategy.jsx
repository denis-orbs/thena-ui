'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { zeroAddress } from 'viem'

import Box from '@/components/box'
import Highlight from '@/components/highlight'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Selection from '@/components/selection'
import SelectorGrid from '@/components/selector/SelectorGrid'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, NARROW_TYPES } from '@/constant'
import { ichiVaultAbi } from '@/constant/abi/fusion'
import { useFusionPairs } from '@/context/fusionsContext'
import { usePairs } from '@/context/pairsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { callMulti } from '@/lib/contractActions'
import {
  cn,
  formatAmount,
  getDisplayedStrategy,
  getLiquidityRangeType,
  unwrappedSymbol,
  wrappedAddress,
} from '@/lib/utils'
import { DEFAULT_LOCALE } from '@/modules/Pools/LiquidityChartRangeInput'
import { Bound, updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoCircleWhite } from '@/svgs'

import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import LiquidityChartRangeInput from './FusionAdd/LiquidityChartRangeInput'

const feeAmount = 3000

const defaultSwapFees = {
  address: zeroAddress,
  tvl: new BigNumber(0),
  totalSupply: 0,
  lpPrice: 0,
  type: 'Conc Liquidity',
  gauge: {
    apr: new BigNumber(0),
    projectedApr: new BigNumber(0),
    voteApr: new BigNumber(0),
    totalSupply: 0,
    address: '0x0000000000000000000000000000000000000000',
    fee: '0x0000000000000000000000000000000000000000',
    bribe: '0x0000000000000000000000000000000000000000',
    weight: new BigNumber(0),
    weightPercent: new BigNumber(0),
    bribes: {
      fee: null,
      bribe: null,
    },
    isAlive: false,
    tvl: new BigNumber(0),
    bribeUsd: new BigNumber(0),
    pooled0: new BigNumber(0),
    pooled1: new BigNumber(0),
  },
  allowed: {},
  stable: false,
  title: 'CL_SwapFee',
  account: {
    walletBalance: new BigNumber(0),
    gaugeBalance: new BigNumber(0),
    gaugeEarned: new BigNumber(0),
    totalLp: new BigNumber(0),
    token0claimable: new BigNumber(0),
    token1claimable: new BigNumber(0),
    staked0: new BigNumber(0),
    staked1: new BigNumber(0),
    stakedUsd: new BigNumber(0),
    earnedUsd: new BigNumber(0),
    total0: new BigNumber(0),
    total1: new BigNumber(0),
    totalUsd: new BigNumber(0),
  },
}

// Used to format floats representing percent change with fixed decimal places
// FIXME: edit this function
function formatDelta(delta, locale = DEFAULT_LOCALE) {
  if (delta === null || delta === undefined || delta === Infinity || isNaN(delta)) {
    return '-'
  }

  return `${Number(Math.abs(delta).toFixed(2)).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  })}%`
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
  } else if (ICHI_TYPES.includes(strategy.title)) {
    preset = await fetchIchiInfo(chainId, strategy, currentTick)
  }
  return preset
}

export default function ChooseStrategy({ pairType, firstAsset, secondAsset, isAdd, isModal }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const { strategy } = useV3MintState()
  const { networkId } = useChainSettings()
  const { pairs } = usePairs()
  const fusionPairs = useFusionPairs()

  const [isAutomatic, setIsAutomatic] = useState(true)

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
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)

  // const {
  //   data: pairPrices = [],
  //   isLoading,
  //   error,
  // } = useFetchPairPrices({
  //   token0Address: wrappedAddress(pair?.token0),
  //   token1Address: wrappedAddress(pair?.token1),
  //   timeWindow: PairDataTimeWindow.YEAR,
  // })

  // const minValue = useMemo(
  //   () => pairPrices.reduce((min, current) => (current.value < min.value ? current : min), pairPrices[0]),
  //   [pairPrices],
  // )

  // const maxValue = useMemo(
  //   () => pairPrices.reduce((max, current) => (current.value > max.value ? current : max), pairPrices[0]),
  //   [pairPrices],
  // )

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
  // const isSorted = baseCurrency?.wrapped.sortsBefore(quoteCurrency?.wrapped)

  const brushLabelValue = useCallback(
    (d, x) => {
      if (!price) return ''

      if (d === 'w' && mintInfo.ticksAtLimit?.[Bound.UPPER]) return '0'
      if (d === 'e' && mintInfo.ticksAtLimit?.[Bound.LOWER]) return '∞'

      const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

      return price ? `${(Math.sign(percent) < 0 ? '-' : '') + formatDelta(percent)}` : ''
    },
    [price, mintInfo.ticksAtLimit],
  )

  useEffect(() => {
    if (!price) return

    dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))
    onLeftRangeInput(preset ? String(+price * preset.min) : '')
    onRightRangeInput(preset ? String(+price * preset.max) : '')
    onChangePresetRange(preset)
  }, [preset, dispatch, onChangePresetRange, onLeftRangeInput, onRightRangeInput, price])

  useEffect(() => {
    if (isAdd) {
      defaultSwapFees.token0 = firstAsset
      defaultSwapFees.token1 = secondAsset
      defaultSwapFees.address = zeroAddress
    }
  }, [firstAsset, isAdd, secondAsset])

  const setStrategy = useCallback(
    strategyInfo => {
      onLeftRangeInput('')
      onRightRangeInput('')
      dispatch(updateStrategy({ strategy: strategyInfo }))
      onChangeLiquidityRangeType(getLiquidityRangeType(strategyInfo.title))
    },
    [dispatch, onChangeLiquidityRangeType, onLeftRangeInput, onRightRangeInput],
  )

  const strategyData = useMemo(() => {
    const autoStrategy = (pair?.subpools && pair.subpools.length > 0 ? pair.subpools : [defaultSwapFees])
      .filter(item => !MANUAL_TYPES.includes(item.title))
      .map(sub => ({
        content: (
          <div className='flex flex-1 items-center justify-between'>
            <div>
              <TextHeading>{getDisplayedStrategy(sub.title)}</TextHeading>

              <div className='mt-1 flex flex-wrap gap-2'>
                <div className='flex items-center gap-1'>
                  <TextHeading className='text-sm'>{t('TVL')}:</TextHeading>
                  <Paragraph className='text-sm'>${formatAmount(sub.tvl)}</Paragraph>
                </div>
              </div>
            </div>

            <TextHeading className='font-archia text-xl font-semibold text-primary-600'>
              {formatAmount(sub.gauge.apr)}%
            </TextHeading>

            <div className='flex flex-wrap justify-end gap-2'>
              {ICHI_TYPES.includes(sub.title) && (
                <div className='flex flex-col items-center gap-1'>
                  <CircleImage alt={sub.title} className='h-8 w-8' src={sub.allowed.logoURI} />
                  <Paragraph className='text-sm'>{t('Deposit')}</Paragraph>
                </div>
              )}
              {NARROW_TYPES.includes(sub.title) && (
                <div className='flex flex-col items-center gap-1'>
                  <IconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'outline-2 w-7 h-7',
                    }}
                    logo1={sub.token0.logoURI}
                    logo2={sub.token1.logoURI}
                  />
                  <Paragraph className='text-sm'>{t('Deposit')}</Paragraph>
                </div>
              )}
            </div>
          </div>
        ),
        active: strategy?.address === sub.address,
        onClickHandler: () => {
          setStrategy({
            title: sub.title,
            tvl: sub.tvl.toNumber(),
            account: {
              totalLp: sub?.account?.totalLp?.toNumber(),
              gaugeBalance: sub?.account?.gaugeBalance?.toNumber(),
            },
            allowed: sub.allowed,
            token0: {
              ...sub?.token0,
              reserve: sub?.token0?.reserve?.toNumber(),
              balance: sub?.token0?.balance?.toNumber(),
              totalValue: sub?.token0?.totalValue?.toNumber(),
            },
            token1: {
              ...sub?.token1,
              reserve: sub?.token1?.reserve?.toNumber(),
              balance: sub?.token1?.balance?.toNumber(),
              totalValue: sub?.token1?.totalValue?.toNumber(),
            },
            address: sub.address,
            isAutomatic: true,
            version: 3,
            fee: sub?.fee,
          })
        },
      }))

    return autoStrategy
  }, [pair?.subpools, t, strategy?.address, setStrategy])

  const strategyType = useMemo(
    () => [
      {
        label: t('Manual'),
        active: !isAutomatic,
        onClickHandler: () => {
          setIsAutomatic(false)
        },
      },
      {
        label: t('Automated'),
        active: isAutomatic,
        onClickHandler: () => {
          setIsAutomatic(true)
        },
      },
    ],
    [isAutomatic, t],
  )

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        <div className='flex flex-col gap-5 lg:flex-row'>
          <div className='flex flex-col gap-3 lg:flex-[6]'>
            <div className='flex flex-row items-center justify-between'>
              <div className='flex flex-row items-center justify-between gap-2'>
                <TextHeading className='font-archia text-3xl font-semibold text-neutral-50'>
                  {t('Automated Strategies')}
                </TextHeading>
                <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-700'>
                  <InfoCircleWhite className='h-5 w-5 stroke-neutral-400' />
                </div>
              </div>
              <Selection data={strategyType} isTranslation={false} />
            </div>
            {strategyData ? (
              <SelectorGrid data={strategyData} selected={strategy} setSelected={setStrategy} />
            ) : (
              <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[60px]'>
                <Highlight>
                  <InfoCircleWhite className='h-4 w-4 stroke-neutral-400' />
                </Highlight>
                <div className='flex flex-col items-center gap-3'>
                  <h2>{t('No strategy found')}</h2>
                </div>
              </div>
            )}
            {strategy && strategy.isAutomatic && (
              <div className='grid grid-cols-1 gap-2 lg:grid-cols-2'>
                <div className='flex flex-col gap-2'>
                  <Paragraph>
                    {t('Min [symbol0] per [symbol1] price', {
                      symbol0: strategy?.token0.symbol,
                      symbol1: strategy?.token1.symbol,
                    })}
                  </Paragraph>
                  <Box className='space-y-3 border border-neutral-700 bg-transparent'>
                    <Paragraph className='text-xl text-neutral-400'>{formatAmount(0)}</Paragraph>
                    <div className='flex flex-row items-center justify-between'>
                      <Paragraph className='text-[10px]'>
                        {strategy.token0.symbol} = {priceLower ? priceLower.toSignificant(5) : 0}{' '}
                        {strategy.token1.symbol}
                      </Paragraph>
                      <Paragraph className='text-[10px]'>{brushLabelValue('w', [0])}</Paragraph>
                    </div>
                  </Box>
                </div>
                <div className='flex flex-col gap-2'>
                  <Paragraph>
                    {t('Max [symbol0] per [symbol1] price', {
                      symbol0: strategy?.token0.symbol,
                      symbol1: strategy?.token1.symbol,
                    })}
                  </Paragraph>
                  <Box className='space-y-3 border border-neutral-700 bg-transparent'>
                    <Paragraph className='text-xl text-neutral-400'>{formatAmount(0)}</Paragraph>
                    <div className='flex flex-row items-center justify-between'>
                      <Paragraph className='text-[10px]'>
                        {strategy.token0.symbol} = {priceUpper ? priceUpper.toSignificant(5) : 0}{' '}
                        {strategy.token1.symbol}
                      </Paragraph>
                      <Paragraph className='text-[10px]'>{brushLabelValue('e', [1])}</Paragraph>
                    </div>
                  </Box>
                </div>
              </div>
            )}
          </div>

          {strategy && strategy.isAutomatic && (
            <div className='hidden flex-[4] flex-col gap-5 lg:flex'>
              <Box className='flex flex-row items-center justify-between rounded-xl bg-neutral-800'>
                <TextHeading className='font-archia text-3xl font-semibold text-neutral-50'>
                  {t('Pool Attributes')}
                </TextHeading>
                <div className='flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-600'>
                  <InfoCircleWhite className='h-5 w-5 stroke-neutral-400' />
                </div>
              </Box>
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

              {/* <Box className={cn('hidden', priceLower && priceUpper && 'block')}>
                  <div className='flex flex-col items-start gap-2 lg:flex-row lg:justify-between'>
                    <h6 className='font-bold'>Historical price</h6>
                    <Tabs data={periods} />
                  </div>
                  {isLoading ? (
                    <Skeleton className='mt-2 flex h-[300px] items-center justify-center' />
                  ) : (
                    <div className='mt-2 flex h-[300px] items-center justify-center'>
                      {error ? (
                        <Paragraph>Failed to load price chart for this pair</Paragraph>
                      ) : (
                        <PoolChart
                          data={pairPrices}
                          timeWindow={timeWindow}
                          upper={maxValue?.value}
                          lower={minValue?.value}
                        />
                      )}
                    </div>
                  )}
                </Box> */}
            </div>
          )}

          {/* {strategy && !strategy.isAutomatic && (
              <ManualStrategy
                firstAsset={firstAsset}
                secondAsset={secondAsset}
                isReverse={isReverse}
                strategy={strategy}
              />
            )} */}
        </div>
      </div>
    </>
  )
}
