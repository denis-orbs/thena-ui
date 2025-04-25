import BigNumber from 'bignumber.js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { maxUint128 } from 'viem'

import { EmphasisButton, OutlinedButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES, PAIR_TYPES } from '@/constant'
import { ManualsContext } from '@/context/manualsContext'
import { useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraBurn } from '@/hooks/fusion/useAlgebra'
import usePrevious from '@/hooks/usePrevious'
import { simulateCall } from '@/lib/contractActions'
import { getPositionManagerContract } from '@/lib/contracts'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { cn, formatAmount, fromWei, getLiquidityRangeType, unwrappedSymbol } from '@/lib/utils'
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
  const { mutateManual } = useContext(ManualsContext)
  const pools = usePools()
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

  const [claimPopup, setClaimPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)
  const reversePrice = false
  const { pending, onAlgebraBurn } = useAlgebraBurn(position?.version ?? 3)

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

  const token0 = useToken(asset0.address)
  const token1 = useToken(asset1.address)

  const poolInfo = useMemo(
    () =>
      pools.find(item => item?.address?.toLowerCase() === poolAddress?.toLowerCase() && item.title === 'CL_SwapFee'),
    [poolAddress, pools],
  )

  const [reward0, reward1] = rewards

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
    dispatch(updateLiquidityRangeType({ liquidityRangeType: getLiquidityRangeType(poolInfo?.title) }))
    push(`/pools/add-liquidity?step=3&poolAddress=${poolInfo?.basePool}&pid=${tokenId}&type=${poolInfo?.title}&back=1`)
  }, [dispatch, poolInfo, push, version, tokenId])

  return (
    <div className='flex flex-col items-center justify-between gap-4  py-4 lg:flex-row lg:py-2'>
      <div className='flex w-full items-center gap-2 lg:w-[20%] lg:min-w-[195px]'>
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
          <TextHeading>{formatAmount(position.apr)}%</TextHeading>
          <TextSubHeading className=''>{t('APR')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 flex-col'>
          <TextHeading>${formatAmount(position.fiatValueOfLiquidity)}</TextHeading>
          <TextSubHeading className=''>{t('Value')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 flex-col'>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
            {feesInUsd.gt(0) && <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${tokenId}`} />}
            {fees && (
              <CustomTooltip id={`net-${tokenId}`}>
                <p>{`${formatAmount(fromWei(fees[0], asset0.decimals))} ${unwrappedSymbol(asset0)}`}</p>
                <p>{`${formatAmount(fromWei(fees[1], asset1.decimals))} ${unwrappedSymbol(asset1)}`}</p>
              </CustomTooltip>
            )}
          </div>
          <TextSubHeading className=''>{t('Reward')}</TextSubHeading>
        </div>
      </div>
      <div id='BUTTONS_GROUP' className='flex w-full max-w-[269px] gap-2 lg:w-[24%]'>
        {Number(liquidity) > 0 ? (
          <OutlinedButton className='flex-1' onClick={() => setRemovePopup(true)}>
            {t('Remove')}
          </OutlinedButton>
        ) : (
          <OutlinedButton
            className='flex-1'
            onClick={() => onAlgebraBurn(tokenId, () => mutateManual())}
            disabled={pending}
          >
            {t('Burn')}
          </OutlinedButton>
        )}

        {version === 3 && (
          <TextButton
            className={cn('flex-1', { hidden: feesInUsd.isZero() })}
            disabled={feesInUsd.isZero()}
            onClick={() => setClaimPopup(true)}
          >
            {t('Claim')}
          </TextButton>
        )}

        {version === 3 && (
          <EmphasisButton className='flex-1' onClick={handleAdd}>
            {t('Add')}
          </EmphasisButton>
        )}

        {version === 2 && Number(liquidity) > 0 && (
          <Link href={`/pools/migration?tokenId=${tokenId}`} className='flex-1'>
            <PrimaryButton className='w-full'>{t('Migrate')}</PrimaryButton>
          </Link>
        )}
      </div>

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
    </div>
  )
}

export default ManualItem
