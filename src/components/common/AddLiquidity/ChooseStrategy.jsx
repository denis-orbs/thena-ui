'use client'

import BigNumber from 'bignumber.js'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { zeroAddress } from 'viem'

import { Info } from '@/components/alert'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import NextImage from '@/components/image/NextImage'
import Input from '@/components/input'
import Selection from '@/components/selection'
import SelectorGrid from '@/components/selector/SelectorGrid'
import Toggle from '@/components/toggle'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, NARROW_TYPES } from '@/constant'
import { ichiVaultAbi } from '@/constant/abi/fusion'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { callMulti } from '@/lib/contractActions'
import { cn, formatAmount, getDisplayedStrategy, getLiquidityRangeType, wrappedAddress } from '@/lib/utils'
import SelectToken from '@/modules/Pools/SelectToken'
import { updateIsReverse, updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { usePairInfo } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoCircleWhite, InfoIcon, TransferIcon } from '@/svgs'

import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import ManualStrategy from './FusionAdd/ManualStrategy'

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
  isAutomatic: false,
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

export default function ChooseStrategy({ pairType, firstAsset, secondAsset, isModal, isReverse, mintInfo }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()

  const { strategy, startPriceTypedValue } = useV3MintState()
  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType, onStartPriceInput } =
    useV3MintActionHandlers(mintInfo.noLiquidity)
  const { networkId } = useChainSettings()

  const [isAutomatic, setIsAutomatic] = useState(strategy?.isAutomatic ?? false)

  const currencyA = useCurrency(firstAsset?.address)
  const currencyB = useCurrency(secondAsset?.address)
  const baseCurrency = useMemo(() => (isReverse ? currencyB : currencyA), [isReverse, currencyA, currencyB])
  const quoteCurrency = useMemo(() => (isReverse ? currencyA : currencyB), [isReverse, currencyA, currencyB])

  const poolAddress = searchParams.get('poolAddress')
  const pair = usePairInfo({
    token0Address: wrappedAddress(firstAsset),
    token1Address: wrappedAddress(secondAsset),
    poolAddress,
    type: pairType,
  })

  const { data: preset } = useSWR(
    strategy && pair && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy, pair.currentTick),
    {
      refreshInterval: 0,
    },
  )

  const hasFarming = useMemo(() => pair.subpools.some(pool => pool.title === 'CL_Farming'), [pair.subpools])
  const hasSwapFee = useMemo(() => pair.subpools.some(pool => pool.title === 'CL_SwapFee'), [pair.subpools])
  const showToggle = useMemo(() => firstAsset && secondAsset, [firstAsset, secondAsset])
  const price = useMemo(() => {
    if (!mintInfo.price) return
    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo])

  useEffect(() => {
    if (!price) return

    dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))
    onLeftRangeInput(preset ? String(+price * preset.min) : '')
    onRightRangeInput(preset ? String(+price * preset.max) : '')
    onChangePresetRange(preset)
  }, [preset, dispatch, onChangePresetRange, onLeftRangeInput, onRightRangeInput, price])

  useEffect(() => {
    defaultSwapFees.token0 = firstAsset
    defaultSwapFees.token1 = secondAsset
    defaultSwapFees.address = zeroAddress
  }, [firstAsset, secondAsset])

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
      const _isAutomatic = !MANUAL_TYPES.includes(sub.title)
      setIsAutomatic(_isAutomatic)

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
          totalValue: sub?.token0?.totalValue,
        },
        token1: {
          ...sub?.token1,
          reserve: sub?.token1?.reserve?.toNumber(),
          balance: sub?.token1?.balance?.toNumber(),
          totalValue: sub?.token1?.totalValue,
        },
        address: sub.address,
        isFarming: sub.title.includes('Farming'),
        isAutomatic: _isAutomatic,
        isDefault: sub?.isDefault,
        version: 3,
        fee: sub?.fee,
      })
    },
    [setStrategy],
  )

  useEffect(() => {
    if (!poolAddress && (!firstAsset || !secondAsset)) return

    if (!pair?.subpools && !strategy) {
      handleChooseStrategy(defaultSwapFees)
      return
    }

    if (pair?.subpools && (!strategy || strategy?.isDefault)) {
      const priority = {
        CL_Farming: 1,
        CL_SwapFee: 2,
      }
      let _strategy = pair.subpools.sort((a, b) => (priority[a.title] || 3) - (priority[b.title] || 3)).at(0)
      if (!_strategy) _strategy = pair.subpools.find(item => !MANUAL_TYPES.includes(item.title))
      handleChooseStrategy(_strategy ?? defaultSwapFees)
    }
  }, [firstAsset, handleChooseStrategy, pair?.subpools, poolAddress, secondAsset, strategy])

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

  return (
    <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
      <div className='flex-[6] space-y-8'>
        <StrategyTitle
          strategyCount={strategyAutoData.length}
          isAutomatic={isAutomatic}
          toggleStrategyType={toggleStrategyType}
        />

        {strategyAutoData && isAutomatic && <SelectorGrid data={strategyAutoData} isGrid />}

        {!isAutomatic && (
          <div className='space-y-4'>
            <article className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <SelectToken
                selectedAsset={firstAsset}
                otherAsset={secondAsset}
                hiddenTokens={[secondAsset?.adddress]}
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
                    onChange={e => onStartPriceInput(e.target.value)}
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

            {hasSwapFee && hasFarming && (
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
                className={cn(showToggle ? '' : 'hidden')}
              />
            )}

            <article
              className={cn(
                'flex items-center justify-between rounded-xl bg-primary-950 p-6 font-medium',
                showToggle ? '' : 'hidden',
              )}
            >
              <div className='flex flex-col gap-1'>
                <Paragraph>{strategy?.title === 'CL_SwapFee' ? 'Earn Fees' : 'Earn THE'}</Paragraph>
                <div className='flex flex-wrap gap-2'>
                  <div className='flex items-center gap-1'>
                    <Paragraph className=''>{t('TVL')}:</Paragraph>
                    <TextHeading className=''>${formatAmount(strategy?.tvl)}</TextHeading>
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap justify-end gap-2'>
                <TextHeading className='text-center font-archia'>
                  <Paragraph>Estimate APR</Paragraph>
                  <p className='text-xl font-semibold text-primary-600'>{formatAmount(mintInfo.estimateAPR)}%</p>
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
          </div>
        )}

        {strategy && !isAutomatic && (
          <ManualStrategy
            firstAsset={firstAsset ?? pair?.token0}
            secondAsset={secondAsset ?? pair?.token1}
            strategy={strategy}
          />
        )}
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
