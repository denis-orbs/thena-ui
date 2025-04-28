import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { zeroAddress } from 'viem'

import { EmphasisButton, OutlinedButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES, PAIR_TYPES } from '@/constant'
import { ManualsContext } from '@/context/manualsContext'
import { useAlgebraBurn, useAlgebraEnterFarming } from '@/hooks/fusion/useAlgebra'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { cn, formatAmount, fromWei, getLiquidityRangeType, unwrappedSymbol } from '@/lib/utils'
import ClaimModal from '@/modules/Position/ClaimModal'
import RemoveManualModal from '@/modules/Position/RemoveManualModal'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
// import { useFarmRewards } from '@/state/farmReward/store'
import { Bound, updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { usePools } from '@/state/pools/hooks'
import { InfoIcon } from '@/svgs'

import Range from './Range'

function FarmingItem({ position }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const { push } = useRouter()
  const { account } = useWallet()
  const pools = usePools()
  const { mutateManual } = useContext(ManualsContext)
  const { addReward } = useFarmRewards()

  const [claimPopup, setClaimPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)

  const {
    asset0,
    asset1,
    liquidity,
    tickLower,
    tickUpper,
    tokenId,
    version,
    key: poolKey,
    fusionState,
    fusion,
    poolAddress,
    farmRewardData,
  } = position

  // CALL APIs & SMART CONTRACTS
  const { onEnterFarming, pending: isEnterFarmLoading } = useAlgebraEnterFarming()
  const { onAlgebraBurn, pending } = useAlgebraBurn()

  const { incentiveAddress } = usePoolAlgebraInfo(asset0?.address, asset1?.address)

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

  const poolInfo = useMemo(
    () =>
      pools.find(item => item?.address?.toLowerCase() === poolAddress?.toLowerCase() && item.title === 'CL_Farming'),
    [poolAddress, pools],
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
          <NewTextSubHeading className='text-xl font-semibold md:text-xl'>
            {unwrappedSymbol(asset0)}/{unwrappedSymbol(asset1)}
          </NewTextSubHeading>
          <Paragraph className='text-xl max-lg:font-archia max-lg:font-semibold lg:text-xs'>
            #{tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
          </Paragraph>
        </div>
      </div>
      <div className='w-full  min-w-[146px] text-center lg:w-[17%]'>
        {position.type === 'Manual' && (
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
        )}
      </div>
      <div className='flex w-full gap-4 lg:w-[39%]'>
        <div className='flex w-1/3 flex-col'>
          <TextHeading>{formatAmount(position.apr)}%</TextHeading>
          <TextSubHeading className=''>{t('APR')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 flex-col'>
          <TextHeading>${formatAmount(position.fiatValueOfLiquidity)}</TextHeading>
          <TextSubHeading className=''>{t('Value')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 flex-col'>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(position.rewardUsd)}</TextHeading>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${tokenId}`} />
            <CustomTooltip id={`net-${tokenId}`}>
              <p className={cn(position.farmRewardData && position.farmRewardData[0] === 0n && 'hidden')}>
                {`${formatAmount(fromWei(position.farmRewardData?.[0] ?? 0n, 18))} THE`}
              </p>
              <p className={cn(position.farmRewardData && position.farmRewardData[1] === 0n && 'hidden')}>
                {`${formatAmount(fromWei(position.farmRewardData?.[1] ?? 0n, 18))} WBNB`}
              </p>
            </CustomTooltip>
          </div>
          <TextSubHeading>{t('Reward')}</TextSubHeading>
        </div>
      </div>
      <div id='BUTTONS_GROUP' className='flex w-full gap-2 lg:w-[24%] lg:max-w-[269px]'>
        <OutlinedButton
          className={cn('block w-full flex-1', {
            hidden: Number(liquidity) <= 0,
          })}
          onClick={() => setRemovePopup(true)}
        >
          {t('Remove')}
        </OutlinedButton>

        <TextButton
          className={cn('w-full flex-1', position.feesInUsd.isZero() && 'hidden')}
          onClick={() => setClaimPopup(true)}
        >
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
        reward0={position.rewards[0]}
        reward1={position.rewards[1]}
        // mutate={refetchFarm}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
      <RemoveManualModal
        popup={removePopup}
        setPopup={setRemovePopup}
        pool={{ ...position, key: poolKey }}
        position={_position}
        reward0={position.rewards[0]}
        reward1={position.rewards[1]}
        mutateManual={mutateManual}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
    </div>
  )
}

export default FarmingItem
