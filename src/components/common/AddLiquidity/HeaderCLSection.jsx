import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { zeroAddress } from 'viem'

import IconGroup from '@/components/icongroup'
import NewIconGroup from '@/components/icongroup/NewIconGroup'
import CircleImage from '@/components/image/CircleImage'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount, getDisplayedStrategy, getLiquidityRangeType } from '@/lib/utils'
import { useAprStore } from '@/state/APR/store'
import { updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useActivePreset, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import { defaultSwapFees, StrategyTitle } from './ChooseStrategy'
import WarningStartingPrice from './components/WarningStartingPrice'
import { PoolAttributes } from './DepositCLPanel'
import AutomaticStrategy from './FusionAdd/AutomaticStrategy'
import { fetchDefiedgeInfo } from './FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from './FusionAdd/GammaAdd'
import { fetchIchiInfo } from './FusionAdd/IchiAdd'
import ManualPositionInfo from './FusionAdd/ManualPositionInfo'
import StartingPriceInput from './StartingPriceInput'

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
  // setFullRangeWarningShown,
  // fullRangeWarningShown,
}) {
  const t = useTranslations()
  // const currencyA = useCurrency(firstAsset?.address)
  // const currencyB = useCurrency(secondAsset?.address)

  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const poolAddress = searchParams.get('poolAddress')
  const { networkId } = useChainSettings()

  const { strategy } = useV3MintState()
  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const sortedSubPools = useMemo(() => {
    const priority = { CL_Farming: 1, CL_SwapFee: 2, ICHI_Farming: 3, Narrow_Farming: 4, Wide_Farming: 5 }
    return (pair?.subpools || []).sort((a, b) => (priority[a.title] || 6) - (priority[b.title] || 6))
  }, [pair?.subpools])

  const { data: preset } = useSWR(
    strategy && pair && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy, pair.currentTick),
    { refreshInterval: 0 },
  )

  const isEarnFees = useMemo(
    () => (position && !position.pool?.isFarming) || strategy?.title === 'CL_SwapFee',
    [position, strategy?.title],
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

  useEffect(() => {
    dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))
    onChangePresetRange(preset)
  }, [preset, dispatch, onChangePresetRange, onLeftRangeInput, onRightRangeInput])

  useEffect(() => {
    defaultSwapFees.token0 = firstAsset
    defaultSwapFees.token1 = secondAsset
    defaultSwapFees.address = zeroAddress
  }, [firstAsset, secondAsset])

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

  const toggleStrategyType = useCallback(
    enable => {
      const _strategy = sortedSubPools.find(item => {
        if (enable) return !MANUAL_TYPES.includes(item.title)
        return MANUAL_TYPES.includes(item.title)
      })
      handleChooseStrategy(_strategy ?? defaultSwapFees)
      setIsAutomatic(enable)
    },
    [handleChooseStrategy, setIsAutomatic, sortedSubPools],
  )

  const { APRs } = useAprStore()
  const activePreset = useActivePreset()

  return (
    <div
      className={cn(
        'grid gap-4 lg:grid-cols-[1fr_368px] lg:gap-8',
        !isAutomatic && mintInfo.noLiquidity && 'lg:grid-cols-[476px_1fr]',
        isAutomatic && 'lg:grid-cols-[1fr_568px]',
        position && 'lg:grid-cols-[1fr_568px]',
      )}
    >
      <div className='flex flex-col gap-4 lg:gap-2'>
        <div className='flex flex-row items-center gap-2 lg:gap-8'>
          <NewIconGroup logo1={firstAsset?.logoURI ?? UNKNOWN_LOGO} logo2={secondAsset?.logoURI ?? UNKNOWN_LOGO} />
          <div className='flex flex-col gap-2'>
            <NewTextHeading className='text-xl! leading-6! text-neutral-300 lg:text-[36px]! lg:leading-[40px]!'>
              {' '}
              {t('Add Liquidity')}
            </NewTextHeading>
            <TextHeading className='text-xs font-medium lg:hidden lg:text-2xl'>
              {t('Concentrated Liquidity')}
            </TextHeading>
          </div>
        </div>
        <TextHeading className='hidden text-xs font-medium lg:flex lg:text-2xl'>
          {t('Concentrated Liquidity')}
        </TextHeading>
        {mintInfo.noLiquidity && (
          <StartingPriceInput
            mintInfo={mintInfo}
            baseCurrency={firstAsset}
            quoteCurrency={secondAsset}
            lastPrice={lastPrice}
          />
        )}
        {position ? (
          <div className='mt-auto'>
            <PoolAttributes pair={pair} strategy={strategy} />
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
      </div>
      <div className='lg:mt-auto'>
        {!isAutomatic ? (
          <>
            {!mintInfo.noLiquidity ? (
              <>
                {position ? (
                  <ManualPositionInfo
                    baseCurrency={firstAsset}
                    quoteCurrency={secondAsset}
                    position={position}
                    type={type}
                  />
                ) : (
                  <article
                    className={cn(
                      'bg-opacity-50 flex items-center justify-between rounded-xl border border-neutral-600 bg-neutral-900 p-4 font-medium md:px-5 md:py-4',
                    )}
                  >
                    <div className='flex items-center gap-1 md:gap-3 xl:gap-2'>
                      {isEarnFees ? (
                        <IconGroup
                          className='*:not-first:-ml-2'
                          classNames={{
                            image: 'outline-2 size-4 md:size-8',
                          }}
                          logo1={firstAsset?.logoURI}
                          logo2={secondAsset?.logoURI}
                        />
                      ) : (
                        <CircleImage
                          className='size-4 md:size-8'
                          src='https://cdn.thena.fi/assets/THE.png'
                          alt='THENA First Logo'
                        />
                      )}

                      {/* <NewTextSubHeading className='text-xs font-bold text-primary-100 md:text-xl'>
                            {isEarnFees ? 'Earn Fees' : 'Earn $THE'}
                          </NewTextSubHeading> */}
                      <div className='flex flex-col gap-1'>
                        <NewTextSubHeading className='text-primary-100 xl:text-5 text-xs font-bold md:text-xl md:leading-6 xl:leading-7'>
                          {isEarnFees ? 'Fees' : '$THE'}
                        </NewTextSubHeading>
                        <Paragraph className='xl:text-4 text-xs font-medium text-neutral-300 md:text-base md:leading-5 xl:leading-5'>
                          {t('Earn')}
                        </Paragraph>
                      </div>
                    </div>

                    {/* <div className='flex flex-col xl:gap-1'>
                          <NewTextSubHeading className='text-primary-100 xl:text-5 text-xs font-bold md:text-xl md:leading-6 xl:leading-7'>
                            ${formatAmount(position ? position.pool?.tvl : strategy?.tvl)}
                          </NewTextSubHeading>
                          <Paragraph className='md:eading-5 xl:text-4 text-xs font-medium text-neutral-300 md:text-base xl:leading-5'>
                            {t('TVL')}
                          </Paragraph>
                        </div> */}

                    <div className='flex flex-col justify-end xl:gap-1'>
                      <NewTextSubHeading className='xl:text-5 bg-[linear-gradient(90deg,_#B386FF_0%,_#FF86FA_100%)] bg-clip-text text-end text-xs font-bold text-transparent md:text-xl md:leading-6 xl:leading-7'>
                        {formatAmount(
                          APRs?.[activePreset ?? 'current'] && APRs[activePreset ?? 'current'].isZero()
                            ? strategy?.apr
                            : APRs?.[activePreset ?? 'current'],
                        )}
                        %
                      </NewTextSubHeading>
                      <Paragraph className='xl:text-4 text-end text-xs font-medium text-neutral-300 md:text-base md:leading-5 xl:leading-5'>
                        {t(isEarnFees ? 'Historical Weekly APR' : 'Estimated APR')}
                      </Paragraph>
                    </div>
                  </article>
                )}
              </>
            ) : (
              <WarningStartingPrice />
            )}
          </>
        ) : (
          <>{strategyAutoData && isAutomatic && <AutomaticStrategy strategyAutoData={strategyAutoData} isGrid />}</>
        )}
      </div>
    </div>
  )
}
