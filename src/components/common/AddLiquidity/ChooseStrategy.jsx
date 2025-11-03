'use client'

import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { zeroAddress } from 'viem'

import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Selection from '@/components/selection'
import Toggle from '@/components/toggle'
import { NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES } from '@/constant'
import InfoIcon from '@/icons/InfoIcon'
import { cn, formatAmount, getDisplayedStrategy, getLiquidityRangeType, ZERO_VALUE } from '@/lib/utils'
import { updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import AutomaticStrategy from './FusionAdd/AutomaticStrategy'
import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import { fetchIchiInfo } from './FusionAdd/IchiAdd'

export const defaultSwapFees = {
  isDefault: false,
  address: zeroAddress,
  tvl: ZERO_VALUE,
  totalSupply: 0,
  lpPrice: 0,
  type: 'Conc Liquidity',
  gauge: {
    apr: ZERO_VALUE,
    projectedApr: ZERO_VALUE,
    voteApr: ZERO_VALUE,
    totalSupply: 0,
    address: zeroAddress,
    fee: zeroAddress,
    bribe: zeroAddress,
    weight: ZERO_VALUE,
    weightPercent: ZERO_VALUE,
    bribes: {
      fee: null,
      bribe: null,
    },
    isAlive: false,
    tvl: ZERO_VALUE,
    bribeUsd: ZERO_VALUE,
    pooled0: ZERO_VALUE,
    pooled1: ZERO_VALUE,
  },
  allowed: {},
  stable: false,
  isAutomatic: false,
  title: 'CL_SwapFee',
  account: {
    walletBalance: ZERO_VALUE,
    gaugeBalance: ZERO_VALUE,
    gaugeEarned: ZERO_VALUE,
    totalLp: ZERO_VALUE,
    token0claimable: ZERO_VALUE,
    token1claimable: ZERO_VALUE,
    staked0: ZERO_VALUE,
    staked1: ZERO_VALUE,
    stakedUsd: ZERO_VALUE,
    earnedUsd: ZERO_VALUE,
    total0: ZERO_VALUE,
    total1: ZERO_VALUE,
    totalUsd: ZERO_VALUE,
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

export default function ChooseStrategyAuto({
  firstAsset,
  secondAsset,
  pair,
  mintInfo,
  // position,
  isAutomatic,
  setIsAutomatic,
  // setFullRangeWarningShown,
  // fullRangeWarningShown,
  // setLastPrice,
}) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const { networkId } = useChainSettings()

  const { strategy } = useV3MintState()
  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const poolAddress = searchParams.get('poolAddress')

  const sortedSubPools = useMemo(() => {
    const priority = { CL_Farming: 1, CL_SwapFee: 2, ICHI_Farming: 3, Narrow_Farming: 4, Wide_Farming: 5 }
    return (pair?.subpools || []).sort((a, b) => (priority[a.title] || 6) - (priority[b.title] || 6))
  }, [pair?.subpools])

  const { data: preset } = useSWR(
    strategy && pair && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy, pair.currentTick),
    { refreshInterval: 0 },
  )

  // const isEarnFees = useMemo(
  //   () => (position && !position.pool?.isFarming) || strategy?.title === 'CL_SwapFee',
  //   [position, strategy?.title],
  // )

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
        tvl: sub.tvl ? sub.tvl.toNumber() : sub.gauge?.tvl?.toNumber() ?? 0,
        apr: sub.gauge?.apr?.toNumber() ?? 0,
        account: {
          totalLp: sub.account?.totalLp?.toNumber(),
          gaugeBalance: sub.account?.gaugeBalance?.toNumber(),
        },
        allowed: { ...sub.allowed, balance: sub.allowed?.balance?.toNumber() },
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
        fee: sub.fee,
        version: sub.version,
        gauge: {
          ...sub.gauge,
          apr: sub.gauge?.apr?.toNumber(),
          bribeUsd: sub.gauge?.bribeUsd?.toNumber(),
          pooled0: sub.gauge?.pooled0?.toNumber(),
          pooled1: sub.gauge?.pooled1?.toNumber(),
          projectedApr: sub.gauge?.projectedApr?.toNumber(),
          voteApr: sub.gauge?.voteApr?.toNumber(),
          tvl: sub.gauge?.tvl?.toNumber(),
          weight: sub.gauge?.weight?.toNumber(),
          weightPercent: sub.gauge?.weightPercent?.toNumber(),
          apr_list: undefined,
        },
      })
    },
    [setIsAutomatic, setStrategy],
  )

  useEffect(() => {
    if (!poolAddress && (!firstAsset || !secondAsset)) return
    if (strategy && strategy.isDefault) return

    if (!sortedSubPools.length && !strategy) {
      handleChooseStrategy(defaultSwapFees)
      return
    }

    if (sortedSubPools.length && (!strategy || !strategy.isDefault)) {
      const _strategy = sortedSubPools.at(0)
      handleChooseStrategy(_strategy ?? defaultSwapFees)
    }
  }, [firstAsset, handleChooseStrategy, poolAddress, secondAsset, sortedSubPools, strategy])

  useEffect(() => {
    setIsAutomatic(strategy?.isAutomatic ?? false)
  }, [setIsAutomatic, strategy?.isAutomatic])

  // const toggleStrategyType = useCallback(
  //   enable => {
  //     const _strategy = sortedSubPools.find(item => {
  //       if (enable) return !MANUAL_TYPES.includes(item.title)
  //       return MANUAL_TYPES.includes(item.title)
  //     })
  //     handleChooseStrategy(_strategy ?? defaultSwapFees)
  //     setIsAutomatic(enable)
  //   },
  //   [handleChooseStrategy, setIsAutomatic, sortedSubPools],
  // )

  const strategyAutoData = useMemo(() => {
    const autoStrategy = sortedSubPools
      .filter(item => !MANUAL_TYPES.includes(item.title))
      .map(sub => ({
        content: (
          <div className='flex flex-1 items-center justify-between'>
            <div>
              <TextHeading className='text-sm'>{getDisplayedStrategy(sub.title, sub.version)}</TextHeading>
              <div className='mt-1 flex flex-wrap gap-2'>
                <div className='flex items-center gap-1'>
                  <TextHeading className='text-xs text-neutral-400'>{t('TVL')}:</TextHeading>
                  <Paragraph className='text-xs font-medium text-neutral-300 lg:text-xs'>
                    ${formatAmount(sub.tvl ?? sub.gauge.tvl)}
                  </Paragraph>
                </div>
              </div>
            </div>

            <TextHeading className='text-primary-600 text-base font-semibold'>
              {formatAmount(sub.gauge.apr, true)}%
            </TextHeading>

            <div className='flex flex-wrap justify-end gap-2'>
              {ICHI_TYPES.includes(sub.title) && (
                <div className='flex flex-col items-center gap-1'>
                  <CircleImage alt={sub.title} className='size-4' src={sub.allowed.logoURI} />
                  <Paragraph className='text-xs text-neutral-400 lg:text-xs'>{t('Deposit')}</Paragraph>
                </div>
              )}
              {GAMMA_TYPES.includes(sub.title) && (
                <div className='flex flex-col items-center gap-1'>
                  <IconGroup
                    className='*:not-first:-ml-2'
                    classNames={{
                      image: 'outline-2 size-4',
                    }}
                    logo1={sub.token0.logoURI}
                    logo2={sub.token1.logoURI}
                  />
                  <Paragraph className='text-xs text-neutral-400 lg:text-xs'>{t('Deposit')}</Paragraph>
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
      <div className='flex-6'>
        <div className='mt-2 max-md:mt-4 xl:mt-0'>
          {strategyAutoData && isAutomatic && <AutomaticStrategy strategyAutoData={strategyAutoData} isGrid />}

          {/* {!isAutomatic && (
            <ManualStrategy
              firstAsset={firstAsset ?? pair?.token0}
              secondAsset={secondAsset ?? pair?.token1}
              strategy={strategy}
              position={position}
              isEarnFees={isEarnFees}
              setFullRangeWarningShown={setFullRangeWarningShown}
              fullRangeWarningShown={fullRangeWarningShown}
              setLastPrice={setLastPrice}
            />
          )} */}
        </div>
      </div>
    </div>
  )
}

export function StrategyTitle({
  isAutomatic,
  strategyCount,
  toggleStrategyType,
  pair,
  handleChooseStrategy,
  firstAsset,
  secondAsset,
  strategy,
}) {
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

  const hasFarming = useMemo(() => pair?.subpools?.some(pool => pool.title === 'CL_Farming'), [pair?.subpools])
  const hasSwapFee = useMemo(() => pair?.subpools?.some(pool => pool.title === 'CL_SwapFee'), [pair?.subpools])
  const showToggle = useMemo(() => firstAsset && secondAsset, [firstAsset, secondAsset])
  const hasToggle = useMemo(() => hasSwapFee && hasFarming && !isAutomatic, [hasFarming, hasSwapFee, isAutomatic])

  const handleChangeManualType = useCallback(
    event => {
      if (strategy) {
        // event.target.checked=true means "Earn Fees" (not farming)
        // event.target.checked=false means "Earn THE" (farming)
        const isToggleChecked = event.target.checked
        const shouldBeFarming = !isToggleChecked
        const _strategy = pair?.subpools.find(item =>
          shouldBeFarming ? item.title === 'CL_Farming' : item.title === 'CL_SwapFee',
        )
        handleChooseStrategy(_strategy ?? defaultSwapFees)
      }
    },
    [handleChooseStrategy, pair?.subpools, strategy],
  )

  return (
    <article className={cn(strategyCount === 0 && !hasToggle && 'hidden')}>
      <div className={cn('flex flex-col items-start gap-4 md:flex-row md:items-center')}>
        <div className={cn('flex items-center gap-2 max-md:w-full', strategyCount === 0 && 'hidden')}>
          <Selection
            className='w-full max-md:grid max-md:grid-cols-2 md:w-[278px] [&>button]:h-full [&>button]:font-medium'
            data={strategyType}
            isTranslation={false}
            classNames={{
              items: 'md:w-1/2',
            }}
          />
          <i
            onClick={() => setShow(!show)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8 md:size-11 md:min-w-11',
              show ? 'bg-neutral-600' : 'bg-neutral-900',
            )}
          >
            <InfoIcon className='md:size-5' />
          </i>
        </div>
        <div className={cn(!hasToggle && 'hidden')}>
          <Toggle
            checked={!strategy?.isFarming}
            onChange={handleChangeManualType}
            label='Earn Fees'
            className={cn('mt-0! [&>span]:text-base', showToggle ? '' : 'hidden')}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 0, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='h-full overflow-hidden'
      >
        <div className={cn('mt-2 rounded-lg bg-neutral-900 p-4 pt-5')}>
          <Paragraph className='mb-4 block text-base'>
            {t('Depending on the Assets you chose, you will get different Strategies to chose on')}
          </Paragraph>

          <NewTextSubHeading className='text-5! mb-2 block leading-6! font-semibold xl:text-[18px] xl:leading-7!'>
            {t('Manual Strategy')}
          </NewTextSubHeading>
          <Paragraph className='text-[16px] leading-[20px]'>
            {t('Only use if you are experienced in providing concentrated liquidity')}
          </Paragraph>

          <NewTextSubHeading className='text-5! my-2 block leading-6! font-semibold xl:text-[18px] xl:leading-7!'>
            {t('Automatic Strategy')}
          </NewTextSubHeading>
          <Paragraph className='text-base'>{t('If you are new to concentrated liquidity')}</Paragraph>
        </div>
      </motion.div>
    </article>
  )
}
