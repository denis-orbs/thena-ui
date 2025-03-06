'use client'

import BigNumber from 'bignumber.js'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { zeroAddress } from 'viem'

import { PoolAttributesSection } from '@/app/pools/(add-liquidity)/add-liquidity/PoolAttributesSection'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Selection from '@/components/selection'
import { NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, NARROW_TYPES } from '@/constant'
import { cn, formatAmount, getDisplayedStrategy, getLiquidityRangeType } from '@/lib/utils'
import { updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoCircleWhite } from '@/svgs'

import AutomaticStrategy from './FusionAdd/AutomaticStrategy'
import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import { fetchIchiInfo } from './FusionAdd/IchiAdd'
import ManualStrategy from './FusionAdd/ManualStrategy'

const defaultSwapFees = {
  isDefault: false,
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

export default function ChooseStrategy({ firstAsset, secondAsset, pair, mintInfo, position }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const { networkId } = useChainSettings()

  const { strategy } = useV3MintState()
  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const [isAutomatic, setIsAutomatic] = useState(strategy?.isAutomatic ?? false)

  const poolAddress = searchParams.get('poolAddress')

  const sortedSubPools = useMemo(() => {
    const priority = { CL_Farming: 1, CL_SwapFee: 2 }
    return (pair?.subpools || []).sort((a, b) => (priority[a.title] || 3) - (priority[b.title] || 3))
  }, [pair?.subpools])

  const { data: preset } = useSWR(
    strategy && pair && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy, pair.currentTick),
    { refreshInterval: 0 },
  )

  useEffect(() => {
    dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))
    onChangePresetRange(preset)
  }, [preset, dispatch, onChangePresetRange, onLeftRangeInput, onRightRangeInput])

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
      onChangeLiquidityRangeType(getLiquidityRangeType(strategyInfo?.title))
    },
    [dispatch, onChangeLiquidityRangeType, onLeftRangeInput, onRightRangeInput],
  )

  const handleChooseStrategy = useCallback(
    sub => {
      if (!sub) return setStrategy(null)

      const _isAutomatic = !MANUAL_TYPES.includes(sub.title)
      setIsAutomatic(_isAutomatic)

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

  useEffect(() => {
    if (!poolAddress && (!firstAsset || !secondAsset)) return
    if (strategy && strategy.isDefault) return

    if (!sortedSubPools.length && !strategy) {
      handleChooseStrategy(defaultSwapFees)
      return
    }

    if (sortedSubPools.length && (!strategy || !strategy.isDefault)) {
      const priority = { CL_Farming: 1, CL_SwapFee: 2 }
      let _strategy = sortedSubPools.sort((a, b) => (priority[a.title] || 3) - (priority[b.title] || 3)).at(0)
      if (!_strategy) _strategy = sortedSubPools.find(item => !MANUAL_TYPES.includes(item.title))
      handleChooseStrategy(_strategy ?? defaultSwapFees)
    }
  }, [firstAsset, handleChooseStrategy, poolAddress, secondAsset, sortedSubPools, strategy])

  const toggleStrategyType = useCallback(
    enable => {
      const _strategy = sortedSubPools.find(item => {
        if (enable) return !MANUAL_TYPES.includes(item.title)
        return MANUAL_TYPES.includes(item.title)
      })
      handleChooseStrategy(_strategy ?? defaultSwapFees)
      setIsAutomatic(enable)
    },
    [handleChooseStrategy, sortedSubPools],
  )

  const strategyAutoData = useMemo(() => {
    const autoStrategy = sortedSubPools
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
        onClickHandler: () => strategy?.address !== sub.address && handleChooseStrategy(sub),
      }))

    return autoStrategy
  }, [sortedSubPools, t, strategy?.address, handleChooseStrategy])

  return (
    <div className={cn('inline-flex w-full flex-col gap-5')}>
      <div className='flex-[6] space-y-4'>
        <StrategyTitle
          strategyCount={strategyAutoData.length}
          isAutomatic={isAutomatic}
          toggleStrategyType={toggleStrategyType}
          position={position}
        />

        <div className={cn('!mt-2 hidden max-lg:block', { '!mt-24': !!position })}>
          <PoolAttributesSection className='px-4 py-2' strategy={strategy} pair={pair} />
        </div>

        {strategyAutoData && isAutomatic && <AutomaticStrategy strategyAutoData={strategyAutoData} isGrid />}

        {!isAutomatic && (
          <ManualStrategy
            firstAsset={firstAsset ?? pair?.token0}
            secondAsset={secondAsset ?? pair?.token1}
            strategy={strategy}
            position={position}
            pair={pair}
            handleChooseStrategy={handleChooseStrategy}
            defaultSwapFees={defaultSwapFees}
          />
        )}
      </div>
    </div>
  )
}

function StrategyTitle({ isAutomatic, strategyCount, toggleStrategyType, position }) {
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

  if (position) {
    return (
      <NewTextSubHeading className='text-lg font-semibold text-neutral-50'>
        {t('Concentrated Liquidity')}
      </NewTextSubHeading>
    )
  }

  return (
    <article>
      <div className='flex flex-col items-center gap-2 lg:flex-row lg:justify-between'>
        <NewTextSubHeading className='hidden font-semibold text-neutral-50 lg:block'>
          {isAutomatic ? t('Automated Strategies') : t('Concentrated Liquidity')}
        </NewTextSubHeading>

        <div className={cn('flex gap-2 max-lg:w-full', strategyCount === 0 && 'hidden')}>
          <Selection
            className='w-full max-lg:grid max-lg:grid-cols-2 lg:w-fit [&>button]:h-full'
            data={strategyType}
            isTranslation={false}
          />
          <i
            onClick={() => setShow(!show)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8 md:size-12 md:min-w-12',
              show ? 'bg-neutral-700' : 'bg-neutral-800',
            )}
          >
            <InfoCircleWhite className='size-4 stroke-neutral-400 md:size-5' />
          </i>
        </div>
      </div>

      <div className={cn('mt-2 overflow-hidden rounded-lg bg-neutral-800 p-4', show ? 'block' : 'hidden')}>
        <Paragraph className='mb-4 block'>
          Depending on the Assets you chose, you will get different Strategies to chose on.
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
