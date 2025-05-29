import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { CurrencyAmount } from 'thena-sdk-core'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thenafi-fusion-sdk'
import { zeroAddress } from 'viem'
import { useReadContract, useSimulateContract } from 'wagmi'

import { GreenBadge, PrimaryBadge, YellowBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES, PAIR_TYPES, POSITION_EARNED_TYPES } from '@/constant'
import Contracts from '@/constant/contracts'
import { ManualsContext } from '@/context/manualsContext'
import { useCurrency, useGetAsset } from '@/hooks/fusion/Tokens'
import { useAlgebraBurn, useAlgebraEnterFarming } from '@/hooks/fusion/useAlgebra'
import { useCalculateAPR } from '@/hooks/fusion/useEstimateAPR'
import { useFusionState } from '@/hooks/fusion/useFusions'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import { getFarmingCenterContract, getIncentiveContract } from '@/lib/contracts'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { cn, formatAmount, formatAmountLP, fromWei, getLiquidityRangeType, unwrappedSymbol } from '@/lib/utils'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
import { Bound, updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { usePools } from '@/state/pools/hooks'
import { InfoIcon, RefreshIcon } from '@/svgs'

import ClaimModal from './ClaimModal'
import { WarningOutOfRange } from './ManualPosition'
import RemoveManualModal from './RemoveManualModal'

export function FarmingPosition({ position }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const { push } = useRouter()
  const { chainId, account } = useWallet()
  const pools = usePools()
  const { mutateManual } = useContext(ManualsContext)
  const { addReward } = useFarmRewards()

  const [claimPopup, setClaimPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)

  const { asset0, asset1, liquidity, tickLower, tickUpper, tokenId, version } = position
  const currency0 = useCurrency(asset0.address)
  const currency1 = useCurrency(asset1.address)

  // CALL APIs & SMART CONTRACTS
  const { onEnterFarming, pending: isEnterFarmLoading } = useAlgebraEnterFarming()
  const { onAlgebraBurn, pending } = useAlgebraBurn()

  const { incentiveAddress } = usePoolAlgebraInfo(asset0?.address, asset1?.address)
  const [fusionState, fusion, poolAddress] = useFusionState({
    currencyA: currency0,
    currencyB: currency1,
    isFarmingPool: position?.deployer === zeroAddress,
  })

  const incentiveMaker = getIncentiveContract(chainId)
  const { data: poolKey } = useReadContract({
    ...incentiveMaker,
    functionName: 'poolToKey',
    args: [poolAddress],
    query: {
      enabled: !!poolAddress,
      staleTime: Infinity,
    },
  })

  const farmingCenter = getFarmingCenterContract(chainId)
  const { data: farmRewards, refetch: refetchFarm } = useSimulateContract({
    ...farmingCenter,
    functionName: 'collectRewards',
    args: [poolKey, position?.tokenId],
    query: {
      enabled: !!poolKey && !!position?.tokenId,
    },
  })
  const farmRewardData = farmRewards?.result
  const tickAtLimit = useMemo(
    () => ({
      [Bound.LOWER]: tickLower ? tickLower === nearestUsableTick(TickMath.MIN_TICK, TICK_SPACING) : undefined,
      [Bound.UPPER]: tickUpper ? tickUpper === nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING) : undefined,
    }),
    [tickLower, tickUpper],
  )
  const [prevFusionState, prevFusion] = usePrevious([fusionState, fusion]) || []

  const [, _fusion] = useMemo(() => {
    if (!fusion && prevFusion && prevFusionState) {
      return [prevFusionState, prevFusion]
    }

    return [fusionState, fusion]
  }, [fusion, fusionState, prevFusion, prevFusionState])

  const _position = useMemo(() => {
    if (_fusion) {
      return new Position({
        pool: _fusion,
        liquidity: new BigNumber(liquidity).toString(10),
        tickLower,
        tickUpper,
      })
    }
    return undefined
  }, [liquidity, _fusion, tickLower, tickUpper])

  const amount0 = useMemo(() => (_position ? _position.amount0.toExact() : 0), [_position])
  const amount1 = useMemo(() => (_position ? _position.amount1.toExact() : 0), [_position])
  const amount0InUsd = useMemo(() => BigNumber(amount0) * asset0.price, [amount0, asset0])
  const amount1InUsd = useMemo(() => BigNumber(amount1) * asset1.price, [amount1, asset1])

  const poolInfo = useMemo(
    () =>
      pools.find(item => item?.address?.toLowerCase() === poolAddress?.toLowerCase() && item.title === 'CL_Farming'),
    [poolAddress, pools],
  )

  const apr = useCalculateAPR({
    position,
    poolAddress,
    totalLiquidity: _fusion?.liquidity,
    tvl: amount0InUsd + amount1InUsd,
  })

  const THE = useGetAsset(Contracts.THE[chainId])
  const WBNB = useGetAsset(Contracts.WBNB[chainId])

  const { reward0, reward1 } = useMemo(
    () => ({
      reward0: {
        token: THE,
        amount: CurrencyAmount.fromRawAmount(THE, BigNumber(farmRewardData?.[0] ?? 0n)),
      },
      reward1: {
        token: WBNB,
        amount: CurrencyAmount.fromRawAmount(WBNB, BigNumber(farmRewardData?.[1] ?? 0n)),
      },
    }),
    [farmRewardData, THE, WBNB],
  )

  useEffect(() => {
    const amount = fromWei(farmRewardData?.[0] ?? 0n)
    if (amount.isZero()) return

    addReward({
      type: 'manual',
      args: [account, poolKey, tokenId],
      amount,
      key: getKeyFromTokenAddress('manual', [asset0.address, asset1.address]),
    })
  }, [account, addReward, asset0.address, asset1.address, farmRewardData, poolKey, tokenId])

  const feesInUsd = useMemo(() => {
    let usdFee = new BigNumber(0)

    if (farmRewardData) {
      usdFee = usdFee
        .plus(fromWei(farmRewardData[0]).times(THE.price))
        .plus(fromWei(farmRewardData[1]).times(WBNB.price))
    }

    return usdFee
  }, [farmRewardData, THE.price, WBNB.price])

  const fiatValueOfLiquidity = useMemo(() => amount0InUsd + amount1InUsd, [amount0InUsd, amount1InUsd])

  const firstPercent = useMemo(
    () => ((amount0InUsd / (amount0InUsd + amount1InUsd)) * 100).toFixed(2),
    [amount0InUsd, amount1InUsd],
  )

  const [reversePrice, setReversePrice] = useState(false)

  const outOfRange = _fusion ? _fusion.tickCurrent < tickLower || _fusion.tickCurrent >= tickUpper : false

  const handleAdd = useCallback(() => {
    const newStrategy = {
      title: poolInfo?.title,
      tvl: poolInfo?.tvl?.toNumber() ?? 0,
      apr: poolInfo?.apr?.toNumber() ?? 0,
      account: {
        totalLp: poolInfo?.account?.totalLp?.toNumber(),
        gaugeBalance: poolInfo?.account?.gaugeBalance?.toNumber(),
      },
      allowed: poolInfo?.allowed,
      token0: {
        ...poolInfo?.token0,
        reserve: poolInfo?.token0?.reserve?.toNumber(),
        balance: poolInfo?.token0?.balance?.toNumber(),
        totalValue: poolInfo?.token0?.totalValue,
      },
      token1: {
        ...poolInfo?.token1,
        reserve: poolInfo?.token1?.reserve?.toNumber(),
        balance: poolInfo?.token1?.balance?.toNumber(),
        totalValue: poolInfo?.token1?.totalValue,
      },
      address: poolInfo?.address,
      isFarming: poolInfo?.title?.includes('Farming'),
      isAutomatic: !MANUAL_TYPES.includes(poolInfo?.title) && poolInfo?.type === PAIR_TYPES.LSD,
      isDefault: true,
      version,
      fee: poolInfo?.fee,
    }

    dispatch(updateStrategy({ strategy: newStrategy }))
    dispatch(updateLiquidityRangeType({ liquidityRangeType: getLiquidityRangeType(poolInfo.title) }))
    push(`/pools/add-liquidity?step=3&poolAddress=${poolInfo.basePool}&pid=${tokenId}&type=${poolInfo?.title}&back=1`)
  }, [dispatch, poolInfo, push, version, tokenId])

  return (
    <Box className='flex flex-col gap-4'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <IconGroup
            className='-space-x-2'
            classNames={{ image: 'w-8 h-8 outline-2' }}
            logo1={asset0.logoURI}
            logo2={asset1.logoURI}
          />
          <div className='flex flex-col'>
            <TextHeading>
              {unwrappedSymbol(asset0)}/{unwrappedSymbol(asset1)}
            </TextHeading>
            <Paragraph className='text-xs'>
              #{position.tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
            </Paragraph>
          </div>
        </div>

        <div className='flex flex-wrap justify-end gap-2'>
          <GreenBadge>{POSITION_EARNED_TYPES.EARN_THE}</GreenBadge>

          {!Number(liquidity) ? (
            <YellowBadge>{t('Closed')}</YellowBadge>
          ) : outOfRange ? (
            <PrimaryBadge>{t('Out of Range')}</PrimaryBadge>
          ) : (
            <GreenBadge>{t('In Range')}</GreenBadge>
          )}
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-neutral-300'>{t('APR')}</span>
          <span>{formatAmount(apr.toNumber())}%</span>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Deposit Value in USD')}</Paragraph>
          <TextHeading>${formatAmount(fiatValueOfLiquidity)}</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>
            {unwrappedSymbol(asset0)} {t('Deposit')}
          </Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(amount0)}`}</TextHeading>
            {Number(liquidity) > 0 && <TextSubHeading>{`(${formatAmount(firstPercent)}%)`}</TextSubHeading>}
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>
            {unwrappedSymbol(asset1)} {t('Deposit')}
          </Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(amount1)}`}</TextHeading>
            {Number(liquidity) > 0 && <TextSubHeading>({formatAmount(100 - firstPercent)}%)</TextSubHeading>}
          </div>
        </div>

        <div className={cn('flex items-center justify-between', feesInUsd.isZero() && 'hidden')}>
          <Paragraph className='text-sm'>{t('Claimable Amount')}</Paragraph>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${tokenId}`} />
            <CustomTooltip id={`net-${tokenId}`}>
              <p className={cn(farmRewardData && farmRewardData[0] === 0n && 'hidden')}>
                {`${formatAmount(fromWei(farmRewardData?.[0] ?? 0n, 18))} THE`}
              </p>
              <p className={cn(farmRewardData && farmRewardData[1] === 0n && 'hidden')}>
                {`${formatAmount(fromWei(farmRewardData?.[1] ?? 0n, 18))} WBNB`}
              </p>
            </CustomTooltip>
          </div>
        </div>

        <div className={cn('flex items-center gap-1')}>
          <Paragraph className='text-sm'>{t('Price Range')}</Paragraph>
          <RefreshIcon
            className='size-4 cursor-pointer stroke-neutral-50'
            onClick={() => {
              setReversePrice(prev => !prev)
            }}
          />
        </div>

        <div className={cn('grid grid-cols-2 gap-4')}>
          <div className='flex flex-col items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2'>
            <TextSubHeading className='text-xs'>{t('Min Price')}</TextSubHeading>
            <TextHeading>
              {reversePrice
                ? formatAmountLP(1 / formatTickPrice(_position?.token0PriceUpper, tickAtLimit, Bound.UPPER))
                : formatAmountLP(formatTickPrice(_position?.token0PriceLower, tickAtLimit, Bound.LOWER))}
            </TextHeading>
            <Paragraph className='text-[10px]'>
              {t('[symbolA] per [symbolB]', {
                symbolA: unwrappedSymbol(reversePrice ? asset0 : asset1),
                symbolB: unwrappedSymbol(reversePrice ? asset1 : asset0),
              })}
            </Paragraph>
          </div>
          <div className='flex flex-col items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2'>
            <TextSubHeading className='text-xs'>{t('Max Price')}</TextSubHeading>
            <TextHeading>
              {reversePrice
                ? formatAmountLP(1 / formatTickPrice(_position?.token0PriceLower, tickAtLimit, Bound.LOWER))
                : formatAmountLP(formatTickPrice(_position?.token0PriceUpper, tickAtLimit, Bound.UPPER))}
            </TextHeading>
            <Paragraph className='text-[10px]'>
              {t('[symbolA] per [symbolB]', {
                symbolA: unwrappedSymbol(reversePrice ? asset0 : asset1),
                symbolB: unwrappedSymbol(reversePrice ? asset1 : asset0),
              })}
            </Paragraph>
          </div>
        </div>

        <div className={cn('flex flex-col items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2')}>
          <TextSubHeading className='text-xs'>{t('Current Price')}</TextSubHeading>
          <TextHeading>
            {formatAmountLP(
              reversePrice ? 1 / (_fusion?.token0Price.toSignificant(6) || 0) : _fusion?.token0Price.toSignificant(6),
            )}
          </TextHeading>
          <Paragraph className='text-[10px]'>
            {t('[symbolA] per [symbolB]', {
              symbolA: unwrappedSymbol(reversePrice ? asset0 : asset1),
              symbolB: unwrappedSymbol(reversePrice ? asset1 : asset0),
            })}
          </Paragraph>
        </div>

        <Box
          className={cn('border-primary-800 bg-primary-950 flex flex-row items-center justify-between gap-4 border', {
            hidden:
              position?.isFarming ||
              !incentiveAddress ||
              incentiveAddress === zeroAddress ||
              position?.deployer !== zeroAddress ||
              Number(liquidity) <= 0,
          })}
        >
          <div className='size-5'>
            <InfoIcon className='stroke-primary-600 size-5' />
          </div>

          <div className='flex flex-col'>
            <TextSubHeading className='text-primary-100 text-base'>{t('warning un-farming pool')}</TextSubHeading>
          </div>
        </Box>
        <WarningOutOfRange isShow={outOfRange} />
      </div>

      <div id='BUTTONS_GROUP' className='flex w-full gap-3'>
        <OutlinedButton
          className={cn('block w-full', {
            hidden: Number(liquidity) <= 0,
          })}
          onClick={() => setRemovePopup(true)}
        >
          {t('Remove')}
        </OutlinedButton>

        <TextButton className={cn('w-full', feesInUsd.isZero() && 'hidden')} onClick={() => setClaimPopup(true)}>
          {t('Claim')}
        </TextButton>

        <PrimaryButton
          className={cn('w-full', {
            hidden:
              position?.isFarming ||
              !incentiveAddress ||
              incentiveAddress === zeroAddress ||
              position?.deployer !== zeroAddress ||
              Number(liquidity) <= 0,
          })}
          disabled={position?.isFarming || isEnterFarmLoading}
          onClick={() => onEnterFarming({ tokenId, poolAddress }, () => mutateManual())}
        >
          {t('Earn $THE')}
        </PrimaryButton>

        <OutlinedButton
          className={cn('block w-full', {
            hidden: position?.isFarming || Number(liquidity) > 0,
          })}
          onClick={() => onAlgebraBurn(tokenId, () => mutateManual())}
          disabled={pending}
        >
          {t('Burn')}
        </OutlinedButton>

        <EmphasisButton className='w-full' onClick={handleAdd}>
          {t('Add')}
        </EmphasisButton>
      </div>

      <ClaimModal
        popup={claimPopup}
        setPopup={setClaimPopup}
        pool={{ ...position, key: poolKey }}
        reward0={reward0}
        reward1={reward1}
        mutate={refetchFarm}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
      <RemoveManualModal
        popup={removePopup}
        setPopup={setRemovePopup}
        pool={{ ...position, key: poolKey }}
        position={_position}
        reward0={reward0}
        reward1={reward1}
        mutateManual={mutateManual}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
    </Box>
  )
}
