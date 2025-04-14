import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { zeroAddress } from 'viem'
import { useReadContract, useSimulateContract } from 'wagmi'

import { EmphasisButton, OutlinedButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES, PAIR_TYPES } from '@/constant'
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
import { cn, formatAmount, fromWei, getLiquidityRangeType, unwrappedSymbol } from '@/lib/utils'
import ClaimModal from '@/modules/Position/ClaimModal'
import RemoveManualModal from '@/modules/Position/RemoveManualModal'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
import { Bound, updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { usePools } from '@/state/pools/hooks'
import { InfoIcon } from '@/svgs'

import Range from './Range'

function FarmingItem({ position }) {
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

  // const firstPercent = useMemo(
  //   () => ((amount0InUsd / (amount0InUsd + amount1InUsd)) * 100).toFixed(2),
  //   [amount0InUsd, amount1InUsd],
  // )

  const reversePrice = false

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
    <div className='flex flex-col items-center justify-between gap-4 py-4 lg:flex-row lg:py-2'>
      <div className='flex w-full items-center gap-2 lg:w-[20%] lg:min-w-[195px]'>
        <GroupIconTokens
          classNames={{
            image: 'outline-2 w-7 h-7',
            rows: '-space-x-2',
            toolTip: 'hidden',
          }}
          width={32}
          height={32}
          tokens={[asset0, asset1]}
        />
        <div className='flex flex-row justify-between max-lg:w-full max-lg:items-center lg:flex-col'>
          <TextHeading>
            {unwrappedSymbol(asset0)}/{unwrappedSymbol(asset1)}
          </TextHeading>
          <Paragraph className='text-xl max-lg:font-archia max-lg:font-semibold lg:text-xs'>
            #{tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
          </Paragraph>
        </div>
      </div>
      <div className='w-full  min-w-[146px] text-center lg:w-[17%]'>
        {position.type === 'Manual' ? (
          <Range
            position={position}
            currentPrice={parseFloat(
              reversePrice ? 1 / (_fusion?.token0Price.toSignificant(6) || 0) : _fusion?.token0Price.toSignificant(6),
            )}
            minPrice={parseFloat(
              reversePrice
                ? 1 / formatTickPrice(_position?.token0PriceUpper, tickAtLimit, Bound.UPPER)
                : formatTickPrice(_position?.token0PriceLower, tickAtLimit, Bound.LOWER),
            )}
            maxPrice={parseFloat(
              reversePrice
                ? 1 / formatTickPrice(_position?.token0PriceLower, tickAtLimit, Bound.LOWER)
                : formatTickPrice(_position?.token0PriceUpper, tickAtLimit, Bound.UPPER),
            )}
            liquidity={liquidity}
          />
        ) : (
          <></>
        )}
      </div>
      <div className='flex w-full gap-4 lg:w-[39%]'>
        <div className='flex w-1/3 flex-col'>
          <TextHeading>{formatAmount(apr.toNumber())}%</TextHeading>
          <TextSubHeading className=''>{t('APR')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 flex-col'>
          <TextHeading>${formatAmount(fiatValueOfLiquidity)}</TextHeading>
          <TextSubHeading className=''>{t('Value')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 flex-col'>
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
          <TextSubHeading className=''>{t('Reward')}</TextSubHeading>
        </div>
      </div>
      <div id='BUTTONS_GROUP' className='flex w-full max-w-[269px] gap-2 lg:w-[24%]'>
        <OutlinedButton
          className={cn('block w-full flex-1', {
            hidden: Number(liquidity) <= 0,
          })}
          onClick={() => setRemovePopup(true)}
        >
          {t('Remove')}
        </OutlinedButton>

        <TextButton className={cn('w-full flex-1', feesInUsd.isZero() && 'hidden')} onClick={() => setClaimPopup(true)}>
          {t('Claim')}
        </TextButton>

        <PrimaryButton
          className={cn('w-full flex-1 text-nowrap', {
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
          className={cn('block w-full flex-1', {
            hidden: position?.isFarming || Number(liquidity) > 0,
          })}
          onClick={() => onAlgebraBurn(tokenId, () => mutateManual())}
          disabled={pending}
        >
          {t('Burn')}
        </OutlinedButton>

        <EmphasisButton className='w-full flex-1' onClick={handleAdd}>
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
    </div>
  )
}

export default FarmingItem
