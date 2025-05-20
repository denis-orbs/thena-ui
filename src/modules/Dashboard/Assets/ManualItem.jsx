import BigNumber from 'bignumber.js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { maxUint128 } from 'viem'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES, PAIR_TYPES } from '@/constant'
import { ManualsContext } from '@/context/manualsContext'
import { useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraBurn } from '@/hooks/fusion/useAlgebra'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import usePrevious from '@/hooks/usePrevious'
import { simulateCall } from '@/lib/contractActions'
import { getPositionManagerContract } from '@/lib/contracts'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { cn, formatAmount, fromWei, getLiquidityRangeType, isInvalidAmount, unwrappedSymbol } from '@/lib/utils'
import ClaimModal from '@/modules/Position/ClaimModal'
import RemoveManualModal from '@/modules/Position/RemoveManualModal'
import { Bound, updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { usePools } from '@/state/pools/hooks'
import { InfoIcon } from '@/svgs'

import Range from './Range'

export const fetchManualInfo = async (account, tokenId, chainId, version) => {
  const algebraContract = getPositionManagerContract(chainId, version)
  const balance = await simulateCall(
    algebraContract,
    'collect',
    [
      {
        tokenId,
        recipient: account, // some tokens might fail if transferred to address(0)
        amount0Max: maxUint128,
        amount1Max: maxUint128,
      },
    ],
    chainId,
  )
  return balance
}

function ManualItem({ position }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const { push } = useRouter()
  const { isXlDown } = useMediaQuery()

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
    fees,
    feesInUsd,
    rewards,
    fusionState,
    fusion,
    poolAddress,
  } = position

  const pools = usePools()
  const token0 = useToken(asset0.address)
  const token1 = useToken(asset1.address)
  const { mutateManual } = useContext(ManualsContext)
  const { pending, onAlgebraBurn } = useAlgebraBurn(position?.version ?? 3)
  const [prevFusionState, prevFusion] = usePrevious([fusionState, fusion]) || []
  const [reward0, reward1] = rewards

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
      pools.find(item => item?.address?.toLowerCase() === poolAddress?.toLowerCase() && item.title === 'CL_SwapFee'),
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
    dispatch(updateLiquidityRangeType({ liquidityRangeType: getLiquidityRangeType(poolInfo?.title) }))
    push(`/pools/add-liquidity?step=3&poolAddress=${poolInfo?.basePool}&pid=${tokenId}&type=${poolInfo?.title}&back=2`)
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
          tokens={[token0, token1]}
        />
        <div className='flex flex-row justify-between max-xl:w-full max-xl:items-center xl:flex-col'>
          <NewTextSubHeading className='text-xl font-semibold md:text-xl'>
            {unwrappedSymbol(asset0)}/{unwrappedSymbol(asset1)}
          </NewTextSubHeading>
          <Paragraph className='text-lg font-medium text-neutral-500 md:text-lg xl:text-xs xl:text-neutral-300'>
            #{tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
          </Paragraph>
        </div>
      </div>
    ),
    [token0, token1, asset0, asset1, tokenId, _fusion?.fee, t],
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
          <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
          {feesInUsd.gt(0) && (
            <>
              <InfoIcon className='h-4 w-4 stroke-neutral-400 max-xl:hidden' data-tooltip-id={`net-${tokenId}`} />
              <CustomTooltip id={`net-${tokenId}`}>
                <p>{`${formatAmount(fromWei(fees[0], asset0.decimals))} ${unwrappedSymbol(asset0)}`}</p>
                <p>{`${formatAmount(fromWei(fees[1], asset1.decimals))} ${unwrappedSymbol(asset1)}`}</p>
              </CustomTooltip>
            </>
          )}
        </div>
        <TextSubHeading className='font-medium max-xl:text-end xl:text-base'>{t('Reward')}</TextSubHeading>
      </div>
    ),
    [asset0, asset1, fees, feesInUsd, t, tokenId],
  )

  const actionCell = useMemo(
    () => (
      <div
        className={cn('grid w-full gap-2', {
          'grid-cols-3': version === 3,
          'grid-cols-2': (version === 2 && Number(liquidity) > 0) || (version === 3 && feesInUsd.isZero()),
        })}
      >
        {Number(liquidity) > 0 ? (
          <EmphasisButton
            className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
            onClick={() => setRemovePopup(true)}
          >
            {t('Remove')}
          </EmphasisButton>
        ) : (
          <EmphasisButton
            className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
            onClick={() => onAlgebraBurn(tokenId, () => mutateManual())}
            disabled={pending}
          >
            {t('Burn')}
          </EmphasisButton>
        )}

        {version === 3 && (
          <>
            <EmphasisButton
              className={cn('h-8 w-full flex-1 text-xs md:h-11 md:text-base', { hidden: feesInUsd.isZero() })}
              disabled={feesInUsd.isZero()}
              onClick={() => setClaimPopup(true)}
            >
              {t('Claim')}
            </EmphasisButton>
            <EmphasisButton className='h-8 w-full flex-1 text-xs md:h-11 md:text-base' onClick={handleAdd}>
              {t('Add')}
            </EmphasisButton>
          </>
        )}

        {version === 2 && Number(liquidity) > 0 && (
          <Link href={`/pools/migration?tokenId=${tokenId}`} className='h-8 w-full flex-1 md:h-11'>
            <PrimaryButton className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'>{t('Migrate')}</PrimaryButton>
          </Link>
        )}
      </div>
    ),
    [feesInUsd, handleAdd, liquidity, mutateManual, onAlgebraBurn, pending, t, tokenId, version],
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
        pool={position}
        reward0={reward0}
        reward1={reward1}
        mutate={() => {}}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
      <RemoveManualModal
        popup={removePopup}
        setPopup={setRemovePopup}
        pool={position}
        position={_position}
        reward0={reward0}
        reward1={reward1}
        mutateManual={mutateManual}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
    </>
  )
}

export default ManualItem
