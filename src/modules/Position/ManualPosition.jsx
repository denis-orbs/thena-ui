import BigNumber from 'bignumber.js'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { CurrencyAmount } from 'thena-sdk-core'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thenafi-fusion-sdk'
import { maxUint128, zeroAddress } from 'viem'

import { GreenBadge, PrimaryBadge, YellowBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES, PAIR_TYPES, POSITION_EARNED_TYPES } from '@/constant'
import { ManualsContext } from '@/context/manualsContext'
import { useCurrency, useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraBurn } from '@/hooks/fusion/useAlgebra'
import { useCalculateAPR } from '@/hooks/fusion/useEstimateAPR'
import { useFusionState } from '@/hooks/fusion/useFusions'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import { simulateCall } from '@/lib/contractActions'
import { getPositionManagerContract } from '@/lib/contracts'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { cn, formatAmount, formatAmountLP, fromWei, getLiquidityRangeType, unwrappedSymbol } from '@/lib/utils'
import { Bound, updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { usePools } from '@/state/pools/hooks'
import { InfoIcon, RefreshIcon } from '@/svgs'

import ClaimModal from './ClaimModal'
import RemoveManualModal from './RemoveManualModal'

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

export default function ManualPosition({ position }) {
  const t = useTranslations()
  const dispatch = useDispatch()
  const { push } = useRouter()
  const { mutateManual } = useContext(ManualsContext)
  const { account, chainId } = useWallet()
  const pools = usePools()
  const { asset0, asset1, liquidity, tickLower, tickUpper, tokenId, version } = position

  const [claimPopup, setClaimPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)
  const [reversePrice, setReversePrice] = useState(false)

  // MARK: fetch data from ABI and CONTRACT
  const { data: fees, mutate } = useSWR(
    account && tokenId ? ['manuals/fee', tokenId, account, chainId] : null,
    () => fetchManualInfo(account, tokenId, chainId, version),
    {
      refreshInterval: 60000,
    },
  )
  const { pending, onAlgebraBurn } = useAlgebraBurn(position?.version ?? 3)

  const currency0 = useCurrency(asset0.address)
  const currency1 = useCurrency(asset1.address)
  const [fusionState, fusion, poolAddress] = useFusionState({
    currencyA: currency0,
    currencyB: currency1,
    isFarmingPool: position?.deployer === zeroAddress,
    version,
  })

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
  const amount0InUsd = useMemo(() => BigNumber(amount0).times(asset0.price).toNumber(), [amount0, asset0])
  const amount1InUsd = useMemo(() => BigNumber(amount1).times(asset1.price).toNumber(), [amount1, asset1])

  const token0 = useToken(asset0.address)
  const token1 = useToken(asset1.address)

  const poolInfo = useMemo(
    () =>
      pools.find(item => item?.address?.toLowerCase() === poolAddress?.toLowerCase() && item.title === 'CL_SwapFee'),
    [poolAddress, pools],
  )

  const apr = useCalculateAPR({
    position,
    poolAddress,
    totalLiquidity: _fusion?.liquidity,
    tvl: amount0InUsd + amount1InUsd,
  })

  const { reward0, reward1 } = useMemo(
    () => ({
      reward0: {
        token: token0,
        amount: CurrencyAmount.fromRawAmount(token0, BigNumber(fees?.[0] ?? 0n)),
      },
      reward1: {
        token: token1,
        amount: CurrencyAmount.fromRawAmount(token1, BigNumber(fees?.[1] ?? 0n)),
      },
    }),
    [token0, token1, fees],
  )

  const feesInUsd = useMemo(
    () =>
      fromWei(fees ? fees[0] : 0, asset0.decimals)
        .times(asset0?.price ?? 0)
        .plus(fromWei(fees ? fees[1] : 0, asset1.decimals).times(asset1?.price ?? 0)),
    [fees, asset0, asset1],
  )

  const fiatValueOfLiquidity = useMemo(() => amount0InUsd + amount1InUsd, [amount0InUsd, amount1InUsd])

  const firstPercent = useMemo(
    () => ((amount0InUsd / (amount0InUsd + amount1InUsd)) * 100).toFixed(2),
    [amount0InUsd, amount1InUsd],
  )

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
    <Box className='flex flex-col gap-4'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <IconGroup
            className='*:not-first:-ml-2'
            classNames={{ image: 'w-8 h-8 outline-2' }}
            logo1={asset0.logoURI}
            logo2={asset1.logoURI}
          />
          <div className='flex flex-col'>
            <TextHeading>
              {unwrappedSymbol(asset0)}/{unwrappedSymbol(asset1)}
            </TextHeading>
            <Paragraph className='text-xs'>
              #{tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
            </Paragraph>
          </div>
        </div>

        <div className='flex flex-wrap justify-end gap-2'>
          <GreenBadge>{POSITION_EARNED_TYPES.EARN_FEE}</GreenBadge>

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
        <div className={cn('flex items-center justify-between', position?.version === 2 && 'hidden')}>
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
            {feesInUsd.gt(0) && <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${tokenId}`} />}
            <CustomTooltip id={`net-${tokenId}`}>
              {fees && <p>{`${formatAmount(fromWei(fees[0], asset0.decimals))} ${unwrappedSymbol(asset0)}`}</p>}
              {fees && <p>{`${formatAmount(fromWei(fees[1], asset1.decimals))} ${unwrappedSymbol(asset1)}`}</p>}
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
              <>
                {reversePrice
                  ? formatAmountLP(1 / formatTickPrice(_position?.token0PriceUpper, tickAtLimit, Bound.UPPER))
                  : formatAmountLP(formatTickPrice(_position?.token0PriceLower, tickAtLimit, Bound.LOWER))}
              </>
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
        <WarningOutOfRange isShow={outOfRange && Number(liquidity) > 0} />
      </div>

      <div id='BUTTONS_GROUP' className='flex w-full gap-3'>
        {Number(liquidity) > 0 ? (
          <OutlinedButton className='w-full' onClick={() => setRemovePopup(true)}>
            {t('Remove')}
          </OutlinedButton>
        ) : (
          <OutlinedButton
            className='w-full'
            onClick={() => onAlgebraBurn(tokenId, () => mutateManual())}
            disabled={pending}
          >
            {t('Burn')}
          </OutlinedButton>
        )}

        {version === 3 && (
          <TextButton
            className={cn('w-full', { hidden: feesInUsd.isZero() })}
            disabled={feesInUsd.isZero()}
            onClick={() => setClaimPopup(true)}
          >
            {t('Claim')}
          </TextButton>
        )}

        {version === 3 && (
          <EmphasisButton className='w-full' onClick={handleAdd}>
            {t('Add')}
          </EmphasisButton>
        )}

        {version === 2 && Number(liquidity) > 0 && (
          <Link href={`/pools/migration?tokenId=${tokenId}`} className='w-full'>
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
        mutate={mutate}
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
    </Box>
  )
}

export function WarningOutOfRange({ isShow }) {
  const t = useTranslations()

  return (
    <Box
      className={cn('border-primary-800 bg-primary-950 hidden flex-row items-center justify-between gap-4 border', {
        flex: isShow,
      })}
    >
      <div className='size-5'>
        <InfoIcon className='stroke-primary-600 size-5' />
      </div>

      <div className='flex flex-col'>
        <TextSubHeading className='text-primary-100 text-base'>{t('warning Out of Range')}</TextSubHeading>
      </div>
    </Box>
  )
}
