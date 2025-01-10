'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { zeroAddress } from 'viem'

import { NeutralBadge, PrimaryBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import Highlight from '@/components/highlight'
import Selector from '@/components/selector'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES } from '@/constant'
import { ichiVaultAbi } from '@/constant/abi/fusion'
import { useFusionPairs } from '@/context/fusionsContext'
import { usePairs } from '@/context/pairsContext'
import { useCurrency, useGetAsset } from '@/hooks/fusion/Tokens'
import { callMulti } from '@/lib/contractActions'
import { cn, formatAmount, getLiquidityRangeType, unwrappedSymbol, wrappedAddress } from '@/lib/utils'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import PoolChart from '@/modules/SwapChart/PoolChart'
import { Bound, updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings, useLocaleSettings } from '@/state/settings/hooks'
import { InfoCircleWhite } from '@/svgs'

import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import LiquidityChartRangeInput from './FusionAdd/LiquidityChartRangeInput'
import ManualStrategy from './FusionAdd/ManualStrategy'

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
    totalLp: 0,
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

export default function ChooseStrategy({ pairType, firstAsset, secondAsset, isReverse, setIsReverse, isAdd, isModal }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const { strategy } = useV3MintState()
  const { networkId } = useChainSettings()
  const { pairs } = usePairs()
  const fusionPairs = useFusionPairs()
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
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)

  const { data: pairPrices = [], error } = useFetchPairPrices({
    token0Address: useGetAsset(pair?.token0?.address),
    token1Address: useGetAsset(pair?.token1?.address),
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
    const autoStrategy = (isAdd ? [defaultSwapFees] : pair?.subpools || []).map(sub => {
      let { title } = sub
      let isFarming = false

      if (title === 'CL_SwapFee') title = 'Manual (Swap Fees)'
      if (title === 'CL_Farming') {
        title = 'Manual ($THE Emissions)'
        isFarming = true
      } else if (GAMMA_TYPES.includes(sub.title)) {
        title = 'Gamma'
        isFarming = true
      }

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
            {sub.title === 'CL_SwapFee' && <NeutralBadge>80% Fees</NeutralBadge>}
          </div>
        ),
        active: strategy?.address === sub.address,
        onClickHandler: () => {
          setStrategy({
            // ...sub,
            title: sub.title,
            account: {
              totalLp: sub?.account?.totalLp,
              gaugeBalance: sub?.account?.gaugeBalance?.toNumber(),
            },
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
            isAutomatic: !['CL_Farming', 'CL_SwapFee'].includes(sub.title),
            isFarming,
            version: 3,
          })
        },
      }
    })

    return autoStrategy
  }, [isAdd, pair?.subpools, t, strategy?.address, setStrategy])

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

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        <div className='flex flex-col gap-5'>
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

            {strategy && strategy.isAutomatic && (
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

            {strategy && !strategy.isAutomatic && (
              <ManualStrategy
                firstAsset={firstAsset}
                secondAsset={secondAsset}
                isReverse={isReverse}
                setIsReverse={setIsReverse}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
