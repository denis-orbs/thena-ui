import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { zeroAddress } from 'viem'

import { EmphasisButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES, PAIR_TYPES } from '@/constant'
import { ManualsContext } from '@/context/manualsContext'
import { useAlgebraBurn, useAlgebraEnterFarming } from '@/hooks/fusion/useAlgebra'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import usePrevious from '@/hooks/usePrevious'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { cn, formatAmount, fromWei, getLiquidityRangeType, isInvalidAmount, unwrappedSymbol } from '@/lib/utils'
import ClaimModal from '@/modules/Position/ClaimModal'
import RemoveManualModal from '@/modules/Position/RemoveManualModal'
import { Bound, updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { usePools } from '@/state/pools/hooks'
import { InfoIcon } from '@/svgs'

import Range from './Range'

function FarmingItem({ position, isXlDown }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const { push } = useRouter()

  const [claimPopup, setClaimPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)

  const pools = usePools()
  const { mutateManual } = useContext(ManualsContext)
  const { onEnterFarming, pending: isEnterFarmLoading } = useAlgebraEnterFarming()
  const { onAlgebraBurn, pending } = useAlgebraBurn()

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
  } = position

  const { incentiveAddress } = usePoolAlgebraInfo(asset0?.address, asset1?.address)
  const [prevFusionState, prevFusion] = usePrevious([fusionState, fusion]) || []

  const tickAtLimit = useMemo(
    () => ({
      [Bound.LOWER]: tickLower ? tickLower === nearestUsableTick(TickMath.MIN_TICK, TICK_SPACING) : undefined,
      [Bound.UPPER]: tickUpper ? tickUpper === nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING) : undefined,
    }),
    [tickLower, tickUpper],
  )

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

  const outOfRange = useMemo(
    () => (_fusion ? _fusion.tickCurrent < tickLower || _fusion.tickCurrent >= tickUpper : false),
    [_fusion, tickLower, tickUpper],
  )

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
    push(`/pools/add-liquidity?step=3&poolAddress=${poolInfo.basePool}&pid=${tokenId}&type=${poolInfo?.title}&back=2`)
  }, [dispatch, poolInfo, push, version, tokenId])

  const getDisplayName = useCallback(token => (token.name === 'Wrapped BNB' ? 'WBNB' : token.symbol || 'UNKNOWN'), [])

  const renderTokenValue = useMemo(() => {
    const token0Value = position?.amount0
    const token1Value = position?.amount1

    const hasInvalidAmounts = isInvalidAmount(token0Value) && isInvalidAmount(token1Value)
    if (hasInvalidAmounts) return null

    return (
      <>
        {!isInvalidAmount(token0Value) && <p>{`${formatAmount(token0Value)} ${getDisplayName(position.asset0)}`}</p>}
        {!isInvalidAmount(token1Value) && <p>{`${formatAmount(token1Value)} ${getDisplayName(position.asset1)}`}</p>}
      </>
    )
  }, [getDisplayName, position?.amount0, position?.amount1, position.asset0, position.asset1])

  const pairCell = useMemo(
    () => (
      <div className='flex w-full items-center gap-2'>
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
        <div className='flex justify-between max-xl:w-full max-xl:items-center xl:flex-col'>
          <NewTextSubHeading className='text-xl font-semibold md:text-xl'>
            {unwrappedSymbol(asset0)}/{unwrappedSymbol(asset1)}
          </NewTextSubHeading>
          <Paragraph className='text-lg font-medium text-neutral-500 md:text-lg xl:text-xs xl:text-neutral-300'>
            #{tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
          </Paragraph>
        </div>
      </div>
    ),
    [asset0, asset1, tokenId, _fusion?.fee, t],
  )

  const rangeCell = useMemo(
    () => (
      <div className='w-full text-center'>
        {position.type === 'Manual' && (
          <Range
            position={position}
            currentPrice={parseFloat(_fusion?.token0Price.toSignificant(6))}
            minPrice={parseFloat(formatTickPrice(_position?.token0PriceLower, tickAtLimit, Bound.LOWER))}
            maxPrice={parseFloat(formatTickPrice(_position?.token0PriceUpper, tickAtLimit, Bound.UPPER))}
            liquidity={liquidity}
          />
        )}
      </div>
    ),
    [_fusion?.token0Price, _position?.token0PriceLower, _position?.token0PriceUpper, liquidity, position, tickAtLimit],
  )

  const aprCell = useMemo(
    () => (
      <div className='flex flex-col max-xl:flex-1'>
        <TextHeading>{formatAmount(position.apr)}%</TextHeading>
        <TextSubHeading className='font-medium xl:text-base'>{t('APR')}</TextSubHeading>
      </div>
    ),
    [position.apr, t],
  )

  const valueCell = useMemo(
    () => (
      <div className='flex flex-col max-xl:flex-1 max-xl:items-center max-xl:justify-center'>
        <div className='flex items-center gap-1'>
          <TextHeading>${formatAmount(position.fiatValueOfLiquidity)}</TextHeading>
          {renderTokenValue && (
            <>
              <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`value-${position.positionId}`} />
              <CustomTooltip id={`value-${position.positionId}`}>{renderTokenValue}</CustomTooltip>
            </>
          )}
        </div>
        <TextSubHeading className='font-medium xl:text-base'>{t('Value')}</TextSubHeading>
      </div>
    ),
    [position.fiatValueOfLiquidity, position.positionId, renderTokenValue, t],
  )

  const rewardsCell = useMemo(
    () => (
      <div className='flex flex-col max-xl:flex-1'>
        <div className='flex items-center gap-1 max-xl:justify-end'>
          <TextHeading>${formatAmount(position.rewardUsd)}</TextHeading>
          {position.rewardUsd > 0 && (
            <>
              <InfoIcon className='h-4 w-4 stroke-neutral-400 max-xl:hidden' data-tooltip-id={`net-${tokenId}`} />
              <CustomTooltip id={`net-${tokenId}`}>
                <p className={cn(position.farmRewardData && position.farmRewardData[0] === 0n && 'hidden')}>
                  {`${formatAmount(fromWei(position.farmRewardData?.[0] ?? 0n, 18))} THE`}
                </p>
                <p className={cn(position.farmRewardData && position.farmRewardData[1] === 0n && 'hidden')}>
                  {`${formatAmount(fromWei(position.farmRewardData?.[1] ?? 0n, 18))} WBNB`}
                </p>
              </CustomTooltip>
            </>
          )}
        </div>
        <TextSubHeading className='font-medium max-xl:text-end xl:text-base'>{t('Reward')}</TextSubHeading>
      </div>
    ),
    [position.farmRewardData, position.rewardUsd, t, tokenId],
  )

  const hideButton = useMemo(
    () => ({
      remove: Number(liquidity) <= 0,
      claim: position.feesInUsd.isZero(),
      burn: position?.isFarming || Number(liquidity) > 0,
      earn:
        position?.isFarming ||
        !incentiveAddress ||
        incentiveAddress === zeroAddress ||
        position?.deployer !== zeroAddress ||
        Number(liquidity) <= 0,
    }),
    [incentiveAddress, liquidity, position?.deployer, position.feesInUsd, position?.isFarming],
  )

  const actionButtonCount = useMemo(() => {
    let count = 5

    if (hideButton.remove) count -= 1
    if (hideButton.claim) count -= 1
    if (hideButton.burn) count -= 1
    if (hideButton.earn) count -= 1

    return count
  }, [hideButton.burn, hideButton.claim, hideButton.remove, hideButton.earn])

  const actionCell = useMemo(
    () => (
      <div className={`grid grid-cols-${actionButtonCount} w-full gap-2`}>
        <EmphasisButton
          className={cn('h-8 w-full flex-1 text-xs md:h-11 md:text-base', {
            hidden: hideButton.remove,
          })}
          onClick={() => setRemovePopup(true)}
        >
          {t('Remove')}
        </EmphasisButton>

        <EmphasisButton
          className={cn('h-8 w-full flex-1 text-xs md:h-11 md:text-base', { hidden: hideButton.claim })}
          onClick={() => setClaimPopup(true)}
        >
          {t('Claim')}
        </EmphasisButton>

        <EmphasisButton
          className={cn('h-8 w-full flex-1 text-nowrap text-xs md:h-11 md:text-base', {
            hidden: hideButton.earn,
          })}
          disabled={position?.isFarming || isEnterFarmLoading}
          onClick={() => onEnterFarming({ tokenId, poolAddress }, () => mutateManual())}
        >
          {t('Earn $THE')}
        </EmphasisButton>

        <EmphasisButton
          className={cn('h-8 w-full flex-1 text-xs md:h-11 md:text-base', {
            hidden: hideButton.burn,
          })}
          onClick={() => onAlgebraBurn(tokenId, () => mutateManual())}
          disabled={pending}
        >
          {t('Burn')}
        </EmphasisButton>

        <EmphasisButton className='h-8 w-full flex-1 text-xs md:h-11 md:text-base' onClick={handleAdd}>
          {t('Add')}
        </EmphasisButton>
      </div>
    ),
    [
      actionButtonCount,
      handleAdd,
      hideButton.burn,
      hideButton.claim,
      hideButton.earn,
      hideButton.remove,
      isEnterFarmLoading,
      mutateManual,
      onAlgebraBurn,
      onEnterFarming,
      pending,
      poolAddress,
      position?.isFarming,
      t,
      tokenId,
    ],
  )

  return (
    <>
      {!isXlDown ? (
        <>
          <td className='rounded-l-md !pl-4'>{pairCell}</td>
          <td>{rangeCell}</td>
          <td>{aprCell}</td>
          <td>{valueCell}</td>
          <td>{rewardsCell}</td>
          <td className='rounded-r-md !pr-4'>{actionCell}</td>
        </>
      ) : (
        <div className='flex flex-col gap-4 py-4'>
          {pairCell}
          {rangeCell}
          <div className='flex w-full gap-2'>
            {aprCell}
            {valueCell}
            {rewardsCell}
          </div>
          {actionCell}
        </div>
      )}

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
    </>
  )
}

export default FarmingItem
