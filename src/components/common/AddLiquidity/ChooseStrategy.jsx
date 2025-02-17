'use client'

import BigNumber from 'bignumber.js'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { zeroAddress } from 'viem'

import Box from '@/components/box'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Selection from '@/components/selection'
import SelectorGrid from '@/components/selector/SelectorGrid'
import Toggle from '@/components/toggle'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, NARROW_TYPES } from '@/constant'
import { ichiVaultAbi } from '@/constant/abi/fusion'
import { useFusionPairs } from '@/context/fusionsContext'
import { usePairs } from '@/context/pairsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useEstimateAPR } from '@/hooks/fusion/useEstimateAPR'
import { callMulti } from '@/lib/contractActions'
import { cn, formatAmount, getDisplayedStrategy, getLiquidityRangeType, wrappedAddress } from '@/lib/utils'
import { DEFAULT_LOCALE } from '@/modules/Pools/LiquidityChartRangeInput'
import SelectToken from '@/modules/Pools/SelectToken'
import { Bound, updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoCircleWhite } from '@/svgs'

import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import ManualStrategy from './FusionAdd/ManualStrategy'

const feeAmount = 3000

const defaultSwapFees = {
  isDefault: true,
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
  const searchParams = useSearchParams()
  const { replace } = useRouter()

  const { strategy } = useV3MintState()
  const { networkId } = useChainSettings()
  const { pairs } = usePairs()
  const fusionPairs = useFusionPairs()

  const [isAutomatic, setIsAutomatic] = useState(false)

  const pair = useMemo(() => {
    const found = (pairs ?? []).find(
      ele =>
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(firstAsset)) &&
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(secondAsset)) &&
        pairType === ele.type,
    )
    if (!found) return
    const fusionPool = (fusionPairs ?? []).find(ele => found?.address?.toLowerCase() === ele.address)
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
  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)
  const price = useMemo(() => {
    if (!mintInfo.price) return
    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo])
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])

  const apr = useEstimateAPR({
    pool: mintInfo.pool,
    poolAddress: mintInfo.poolAddress,
    tickUpper,
    tickLower,
    isFarming: strategy?.title === MANUAL_TYPES[0],
    tvl: strategy?.tvl,
  })

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

  const handleChooseStrategy = useCallback(
    sub => {
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
        isFarming: sub.title.includes('Farming'),
        isAutomatic: !MANUAL_TYPES.includes(sub.title),
        isDefault: sub?.isDefault,
        version: 3,
        fee: sub?.fee,
      })
    },
    [setStrategy],
  )

  useEffect(() => {
    if (!firstAsset || !secondAsset) return

    if (!pair?.subpools && !strategy) {
      handleChooseStrategy(defaultSwapFees)
      return
    }

    if (pair && pair.subpools && strategy?.isDefault) {
      let _strategy = pair.subpools.find(item => !MANUAL_TYPES.includes(item.title))
      if (!_strategy) _strategy = pair.subpools.find(item => MANUAL_TYPES.includes(item.title))
      handleChooseStrategy(_strategy ?? defaultSwapFees)
    }
  }, [firstAsset, handleChooseStrategy, pair, pair?.subpools, secondAsset, strategy])

  const toggleStrategyType = enable => {
    const _strategy = pair?.subpools.find(item => {
      if (enable) return !MANUAL_TYPES.includes(item.title)
      return MANUAL_TYPES.includes(item.title)
    })

    handleChooseStrategy(_strategy ?? defaultSwapFees)
    setIsAutomatic(enable)
  }

  const strategyAutoData = useMemo(() => {
    const autoStrategy = (pair?.subpools ?? [])
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
        onClickHandler: () => handleChooseStrategy(sub),
      }))

    return autoStrategy
  }, [pair?.subpools, t, strategy?.address, handleChooseStrategy])

  const updateSearchParams = useCallback(
    updates => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const newPathname = `${window.location.pathname}?${params.toString()}`
      replace(newPathname)
    },
    [replace, searchParams],
  )

  return (
    <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
      <div className='flex-[6] space-y-8'>
        <StrategyTitle
          strategyCount={strategyAutoData.length}
          isAutomatic={isAutomatic}
          toggleStrategyType={toggleStrategyType}
        />

        {strategyAutoData && isAutomatic && (
          <SelectorGrid data={strategyAutoData} selected={strategy} setSelected={setStrategy} />
        )}

        {!isAutomatic && (
          <div className='space-y-4'>
            <article className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <SelectToken
                selectedAsset={firstAsset}
                otherAsset={secondAsset}
                setSelectedAsset={item => {
                  if (item) updateSearchParams({ firstAddress: item.address })
                }}
                hiddenTokens={[secondAsset?.adddress]}
                placeHolder={t('Select Token')}
                dropdownAlign='left'
              />
              <SelectToken
                selectedAsset={secondAsset}
                otherAsset={firstAsset}
                hiddenTokens={[firstAsset?.address]}
                setSelectedAsset={item => {
                  if (item) updateSearchParams({ secondAddress: item.address })
                }}
                placeHolder={t('Select Token')}
                dropdownAlign='right'
              />
            </article>
            <Toggle
              checked={!strategy?.isFarming}
              onChange={() => {
                if (strategy) {
                  const _strategy = pair?.subpools.find(item =>
                    strategy.isFarming ? item.title === 'CL_SwapFee' : item.title === 'CL_Farming',
                  )
                  handleChooseStrategy(_strategy ?? defaultSwapFees)
                }
              }}
              label='Earn Fees'
              className={cn(firstAsset && secondAsset ? '' : 'hidden')}
            />
            <article
              className={cn(
                'flex items-center justify-between rounded-xl bg-primary-950 p-6 font-medium',
                firstAsset && secondAsset ? '' : 'hidden',
              )}
            >
              <div>
                <Paragraph>Earn Fees</Paragraph>
                <div className='mt-1 flex flex-wrap gap-2'>
                  <div className='flex items-center gap-1'>
                    <Paragraph className=''>{t('TVL')}:</Paragraph>
                    <TextHeading className=''>${formatAmount(strategy?.tvl)}</TextHeading>
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap justify-end gap-2'>
                <TextHeading className='text-center font-archia'>
                  <Paragraph>Estimate APR</Paragraph>
                  <p className='text-xl font-semibold text-primary-600'>{formatAmount(apr)}%</p>
                </TextHeading>
                <IconGroup
                  className='-space-x-2'
                  classNames={{
                    image: 'outline-2 w-7 h-7',
                  }}
                  logo1={firstAsset?.logoURI}
                  logo2={secondAsset?.logoURI}
                />
              </div>
            </article>
          </div>
        )}

        {strategy && !isAutomatic && (
          <ManualStrategy firstAsset={firstAsset} secondAsset={secondAsset} strategy={strategy} />
        )}

        <div className={cn('grid grid-cols-1 gap-2 lg:grid-cols-2', (!strategy || !isAutomatic) && 'hidden')}>
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
                  {strategy?.token0?.symbol} = {priceLower ? priceLower.toSignificant(5) : 0} {strategy?.token1?.symbol}
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
                  {strategy?.token0?.symbol} = {priceUpper ? priceUpper.toSignificant(5) : 0} {strategy?.token1?.symbol}
                </Paragraph>
                <Paragraph className='text-[10px]'>{brushLabelValue('e', [1])}</Paragraph>
              </div>
            </Box>
          </div>
        </div>
      </div>
    </div>
  )
}

function StrategyTitle({ isAutomatic, strategyCount, toggleStrategyType }) {
  const [show, setShow] = useState(false)
  const t = useTranslations()
  const strategyType = useMemo(
    () => [
      {
        label: t('Manual'),
        active: !isAutomatic,
        onClickHandler: () => {
          toggleStrategyType(false)
        },
      },
      {
        label: t('Automated'),
        active: isAutomatic,
        onClickHandler: () => {
          toggleStrategyType(true)
        },
      },
    ],
    [isAutomatic, toggleStrategyType, t],
  )
  return (
    <article>
      <div className='flex items-center justify-between'>
        <TextHeading className='font-archia text-3xl font-semibold text-neutral-50'>
          {isAutomatic ? t('Automated Strategies') : t('Concentrated Liquidity')}
        </TextHeading>

        <div className={cn('flex gap-2', strategyCount === 0 && 'hidden')}>
          <Selection data={strategyType} isTranslation={false} />
          <i
            onClick={() => setShow(!show)}
            className={cn(
              'flex size-12 cursor-pointer items-center justify-center rounded-lg ',
              show ? 'bg-neutral-700' : 'bg-neutral-800',
            )}
          >
            <InfoCircleWhite className='size-5 stroke-neutral-400' />
          </i>
        </div>
      </div>

      <div className={cn('mt-2 overflow-hidden rounded-lg bg-neutral-800 p-4', show ? 'block' : 'hidden')}>
        <Paragraph className='mb-4 block'>
          Depending on the Assets you chose, you will get diffrent Strategys to chose on.
        </Paragraph>

        <TextHeading className='mb-2 block'>Manual Strategy</TextHeading>
        <Paragraph>
          Only use if you are experienced in providing concentrated liquidity. You can determine a custom price range
          and will earn swap fees as long as the price of the assets stays in that range. If out of range, you will not
          earn any reward until you re-adjust your position accordingly.
        </Paragraph>

        <TextHeading className='mb-2 mt-4 block'>Automatic Strategy</TextHeading>
        <Paragraph>
          If you are new to concentrated liquidity, select one of the available Concentrated Liquidity Automated Market
          Maker (CLAMM) options where your liquidity is managed automatically to stay in range. When you provide
          liquidity, you will begin earning emissions.
        </Paragraph>
      </div>
    </article>
  )
}
