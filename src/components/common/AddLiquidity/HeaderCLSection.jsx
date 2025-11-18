import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { zeroAddress } from 'viem'

import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, THE_LOGO } from '@/constant'
import { useAprStore } from '@/state/APR/store'
import { updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useActivePreset, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'
import { formatAmount, getDisplayedStrategy, getLiquidityRangeType } from '@/utils/utils'

import { defaultSwapFees, StrategyTitle } from './ChooseStrategy'
import WarningStartingPrice from './components/WarningStartingPrice'
import { PoolAttributes } from './DepositCLPanel'
import AutoPositionInfo from './FusionAdd/AutoPositionInfo'
import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import { fetchIchiInfo } from './FusionAdd/IchiAdd'
import ManualPositionInfo from './FusionAdd/ManualPositionInfo'
import StartingPriceInput from './StartingPriceInput'

const fetchStrategyInfo = async (chainId, strategy, currentTick) => {
  if (GAMMA_TYPES.includes(strategy.title)) {
    return await fetchGammaInfo(chainId, strategy)
  }
  if (strategy.title === 'DefiEdge') {
    return await fetchDefiedgeInfo(chainId, strategy, currentTick)
  }
  if (ICHI_TYPES.includes(strategy.title)) {
    return await fetchIchiInfo(chainId, strategy, currentTick)
  }
  return null
}

const transformStrategy = sub => ({
  title: sub.title,
  tvl: sub.tvl?.toNumber() ?? sub.gauge?.tvl?.toNumber() ?? 0,
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
  isAutomatic: !MANUAL_TYPES.includes(sub.title),
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

function DepositIcon({ sub, title }) {
  if (ICHI_TYPES.includes(title)) {
    return (
      <div className='flex flex-col items-center gap-1'>
        <CircleImage alt={title} className='size-4' src={sub.allowed.logoURI} />
        <Paragraph className='text-xs text-neutral-400 xl:text-xs'>Deposit</Paragraph>
      </div>
    )
  }

  if (GAMMA_TYPES.includes(title)) {
    return (
      <div className='flex flex-col items-center gap-1'>
        <IconGroup
          className='*:not-first:-ml-2'
          classNames={{ image: 'outline-2 size-4' }}
          logo1={sub.token0.logoURI}
          logo2={sub.token1.logoURI}
        />
        <Paragraph className='text-xs text-neutral-400 xl:text-xs'>Deposit</Paragraph>
      </div>
    )
  }

  return null
}

function StrategyItem({ sub, t }) {
  return (
    <div className='flex flex-1 items-center justify-between'>
      <div>
        <TextHeading className='text-sm'>{getDisplayedStrategy(sub.title, sub.version)}</TextHeading>
        <div className='mt-1 flex flex-wrap gap-2'>
          <div className='flex items-center gap-1'>
            <TextHeading className='text-xs text-neutral-400'>{t('TVL')}:</TextHeading>
            <Paragraph className='text-xs font-medium text-neutral-300 xl:text-xs'>
              ${formatAmount(sub.tvl ?? sub.gauge.tvl)}
            </Paragraph>
          </div>
        </div>
      </div>

      <TextHeading className='text-primary-600 text-base font-semibold'>
        {formatAmount(sub.gauge.apr, true)}%
      </TextHeading>

      <div className='flex flex-wrap justify-end gap-2'>
        <DepositIcon sub={sub} title={sub.title} />
      </div>
    </div>
  )
}

function ManualStrategyDisplay({ firstAsset, secondAsset, isEarnFees, APRs, activePreset, strategy, t, pair }) {
  const subpool = useMemo(
    () => (pair?.subpools || []).find(sub => sub.address === strategy?.address),

    [pair?.subpools, strategy?.address],
  )

  return (
    <div className='flex flex-col gap-4 max-md:w-full md:flex-row'>
      <div className='flex items-center gap-6 p-4 max-md:w-full'>
        <div className={cn('flex flex-col')}>
          <NewTextSubHeading className={cn('text-gradient-primary text-xl! leading-6!')}>
            ${formatAmount(subpool?.oneDayVolumeUSD)}
          </NewTextSubHeading>
          <Paragraph className={cn('text-bas leading-5! text-neutral-300')}>{t('Volume (24h)')}</Paragraph>
        </div>
        <div className={cn('flex flex-col')}>
          <NewTextSubHeading className={cn('text-gradient-primary text-xl! leading-6!')}>
            ${formatAmount(strategy?.tvl)}
          </NewTextSubHeading>
          <Paragraph className={cn('text-base leading-5! text-neutral-300')}>{t('TVL')}</Paragraph>
        </div>
        <div className={cn('flex flex-col')}>
          <NewTextSubHeading className={cn('text-gradient-primary text-xl! leading-6!')}>
            ${formatAmount(subpool?.oneDayFeesUSD)}
          </NewTextSubHeading>
          <Paragraph className={cn('text-base leading-5! text-neutral-300')}>{t('Fees (24h)')}</Paragraph>
        </div>
      </div>
      <article
        className={cn(
          'bg-opacity-50 flex items-center justify-between gap-6 rounded-xl bg-neutral-900 px-4 py-2 font-medium outline outline-neutral-600',
        )}
      >
        <div className='flex items-center gap-1 md:gap-3 xl:gap-2'>
          {isEarnFees ? (
            <IconGroup
              className='*:not-first:-ml-2'
              classNames={{ image: 'outline-2 size-5 md:size-8' }}
              logo1={firstAsset?.logoURI}
              logo2={secondAsset?.logoURI}
            />
          ) : (
            <CircleImage
              className='size-5 border-[2.5px] border-[#1C2027] md:size-8'
              src={THE_LOGO}
              alt='THENA First Logo'
            />
          )}

          <div className='flex flex-col gap-1'>
            <NewTextSubHeading className='text-gradient-primary text-xl font-medium md:leading-6 xl:leading-6!'>
              {isEarnFees ? 'FEES' : '$THE'}
            </NewTextSubHeading>
            <Paragraph className='text-xs font-normal text-neutral-300 md:text-base md:leading-5 xl:leading-5'>
              {t('Earn')}
            </Paragraph>
          </div>
        </div>

        <div className='flex flex-col justify-end xl:gap-1'>
          <NewTextSubHeading className='text-gradient-primary text-end text-xs font-bold md:text-xl md:leading-6 xl:leading-7'>
            {formatAmount(
              APRs?.[activePreset ?? 'current'] && APRs[activePreset ?? 'current'].isZero()
                ? strategy?.apr
                : APRs?.[activePreset ?? 'current'],
            )}
            %
          </NewTextSubHeading>
          <Paragraph className='text-end text-xs font-medium text-neutral-300 md:text-base md:leading-5 xl:leading-5'>
            {t('Estimated APR')}
          </Paragraph>
        </div>
      </article>
    </div>
  )
}

export default function HeaderCLSection({
  firstAsset,
  secondAsset,
  mintInfo,
  pair,
  position,
  isAutomatic,
  setIsAutomatic,
  lastPrice,
  type,
  isLoading,
}) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const poolAddress = searchParams.get('poolAddress')
  const { networkId } = useChainSettings()
  const { strategy } = useV3MintState()
  const { APRs } = useAprStore()
  const activePreset = useActivePreset()

  const prevStrategyRef = useRef()

  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const sortedSubPools = useMemo(() => {
    const priority = {
      CL_Farming: 1,
      CL_SwapFee: 2,
      ICHI_Farming: 3,
      Narrow_Farming: 4,
      Wide_Farming: 5,
    }
    return (pair?.subpools || []).sort((a, b) => (priority[a.title] || 6) - (priority[b.title] || 6))
  }, [pair?.subpools])

  const swrKey = useMemo(
    () => (strategy && pair ? ['strategy/info', strategy.address, networkId] : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [strategy?.address, pair, networkId],
  )

  const { data: preset } = useSWR(swrKey, () => fetchStrategyInfo(networkId, strategy, pair.currentTick), {
    refreshInterval: 0,
  })

  const isEarnFees = useMemo(
    () => (position && !position.pool?.isFarming) || strategy?.title === 'CL_SwapFee',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [position?.pool?.isFarming, strategy?.title],
  )

  // Stable callback for setting strategy
  const setStrategy = useCallback(
    strategyInfo => {
      // Prevent unnecessary updates
      if (prevStrategyRef.current?.address === strategyInfo?.address) return

      onLeftRangeInput('')
      onRightRangeInput('')
      dispatch(updateStrategy({ strategy: strategyInfo }))
      onChangeLiquidityRangeType(getLiquidityRangeType(strategyInfo?.title))

      prevStrategyRef.current = strategyInfo
    },
    [dispatch, onChangeLiquidityRangeType, onLeftRangeInput, onRightRangeInput],
  )

  // Memoize default swap fees setup
  useEffect(() => {
    if (firstAsset && secondAsset) {
      defaultSwapFees.token0 = firstAsset
      defaultSwapFees.token1 = secondAsset
      defaultSwapFees.address = zeroAddress
    }
  }, [firstAsset, secondAsset])

  // Handle preset updates
  useEffect(() => {
    dispatch(updateSelectedPreset({ preset: preset?.type || null }))
    onChangePresetRange(preset)
  }, [preset, dispatch, onChangePresetRange])

  // Stable callback for choosing strategy
  const handleChooseStrategy = useCallback(
    sub => {
      if (!sub) return setStrategy(null)

      const transformedStrategy = transformStrategy(sub)
      const _isAutomatic = transformedStrategy.isAutomatic

      setIsAutomatic(_isAutomatic)
      setStrategy(transformedStrategy)
    },
    [setIsAutomatic, setStrategy],
  )

  // Auto-select default strategy
  useEffect(() => {
    if (!poolAddress && (!firstAsset || !secondAsset)) return
    if (strategy?.isDefault) return

    if (!sortedSubPools.length && !strategy) {
      handleChooseStrategy(defaultSwapFees)
      return
    }

    if (sortedSubPools.length && (!strategy || !strategy.isDefault)) {
      const defaultStrategy = sortedSubPools[0]
      handleChooseStrategy(defaultStrategy || defaultSwapFees)
    }
  }, [firstAsset, handleChooseStrategy, poolAddress, secondAsset, sortedSubPools, strategy])

  // Memoize automatic strategy data
  const strategyAutoData = useMemo(
    () =>
      sortedSubPools
        .filter(item => !MANUAL_TYPES.includes(item.title))
        .map(sub => ({
          content: <StrategyItem sub={sub} t={t} />,
          active: strategy?.address === sub.address,
          onClickHandler: () => strategy?.address !== sub.address && handleChooseStrategy(sub),
        })),
    [sortedSubPools, strategy?.address, handleChooseStrategy, t],
  )

  // Stable callback for toggling strategy type
  const toggleStrategyType = useCallback(
    enable => {
      const targetStrategy = sortedSubPools.find(item =>
        enable ? !MANUAL_TYPES.includes(item.title) : MANUAL_TYPES.includes(item.title),
      )
      handleChooseStrategy(targetStrategy || defaultSwapFees)
      setIsAutomatic(enable)
    },
    [handleChooseStrategy, setIsAutomatic, sortedSubPools],
  )

  return (
    <div
      className={cn(
        'grid gap-4 xl:grid-cols-[479px_1fr] xl:gap-8',
        !isAutomatic && mintInfo.noLiquidity && 'xl:grid-cols-[470px_1fr]',
        (isAutomatic || position) && 'xl:grid-cols-[435px_1fr]',
      )}
    >
      <div className='flex flex-col gap-4 xl:gap-2'>
        <div className='flex flex-row items-center gap-2 xl:gap-8'>
          <IconGroup
            className='*:not-first:-ml-2'
            classNames={{ image: 'outline-2 size-12' }}
            logo1={firstAsset?.logoURI}
            logo2={secondAsset?.logoURI}
          />
          <div className='flex flex-col gap-2'>
            <NewTextHeading className='text-xl! leading-6! text-neutral-50 xl:text-[36px]! xl:leading-[40px]!'>
              {position ? t('Manage Liquidity') : t('Add Liquidity')}
            </NewTextHeading>
            <TextHeading className='text-xs font-medium text-neutral-300 xl:hidden xl:text-2xl'>
              {position
                ? `${firstAsset.symbol}/${secondAsset.symbol} ${t('Concentrated')}`
                : t('Concentrated Liquidity')}
            </TextHeading>
          </div>
        </div>

        <TextHeading className='hidden text-xs font-medium xl:flex xl:text-2xl'>
          {position ? `${firstAsset.symbol}/${secondAsset.symbol} ${t('Concentrated')}` : t('Concentrated Liquidity')}
        </TextHeading>

        {isLoading ? (
          <Skeleton className='mt-auto h-11' />
        ) : (
          <>
            {mintInfo.noLiquidity && !isAutomatic && (
              <StartingPriceInput
                mintInfo={mintInfo}
                baseCurrency={firstAsset}
                quoteCurrency={secondAsset}
                lastPrice={lastPrice}
              />
            )}

            {position ? (
              <div className={cn('mt-auto max-xl:hidden')}>
                <PoolAttributes
                  pair={pair}
                  strategy={strategy}
                  classNames={{ wrapper: 'w-full', container: 'w-full' }}
                />
              </div>
            ) : (
              <div className='flex flex-col gap-0 xl:gap-4'>
                <StrategyTitle
                  strategyCount={strategyAutoData.length}
                  isAutomatic={isAutomatic}
                  toggleStrategyType={toggleStrategyType}
                  pair={pair}
                  handleChooseStrategy={handleChooseStrategy}
                  firstAsset={firstAsset}
                  secondAsset={secondAsset}
                  strategy={strategy}
                />
              </div>
            )}
          </>
        )}
      </div>

      {isLoading ? (
        <Skeleton className='h-[150px]' />
      ) : (
        <div className='h-full'>
          <div className={cn(!position && 'xl:mt-18')}>
            <div className='flex w-full xl:justify-end'>
              {!isAutomatic ? (
                <>
                  {mintInfo.noLiquidity ? (
                    <WarningStartingPrice />
                  ) : position ? (
                    <ManualPositionInfo
                      baseCurrency={firstAsset}
                      quoteCurrency={secondAsset}
                      position={position}
                      type={type}
                    />
                  ) : (
                    <ManualStrategyDisplay
                      firstAsset={firstAsset}
                      secondAsset={secondAsset}
                      isEarnFees={isEarnFees}
                      APRs={APRs}
                      activePreset={activePreset}
                      strategy={strategy}
                      t={t}
                      pair={pair}
                    />
                  )}
                </>
              ) : (
                <>
                  {position && (
                    <AutoPositionInfo baseCurrency={firstAsset} quoteCurrency={secondAsset} position={position} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
