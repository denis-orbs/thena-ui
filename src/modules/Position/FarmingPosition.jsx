import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useContext, useMemo, useState } from 'react'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { useReadContract, useSimulateContract } from 'wagmi'

import { GreenBadge, PrimaryBadge, YellowBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { ManualsContext } from '@/context/manualsContext'
import { useCurrency, useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraBurn, useAlgebraExitFarming } from '@/hooks/fusion/useAlgebra'
import { useFusionState } from '@/hooks/fusion/useFusions'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import { getAlgebraFactoryContract, getFarmingCenterContract, getInsentiveContract } from '@/lib/contracts'
import { unwrappedToken } from '@/lib/fusion'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { cn, formatAmount, formatAmountLP, fromWei, unwrappedSymbol } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import { usePools } from '@/state/pools/hooks'
import { InfoIcon, RefreshIcon } from '@/svgs'

import AddManualModal from './AddManualModal'
import ClaimModal from './ClaimModal'
import RemoveManualModal from './RemoveManualModal'

export function FarmingPosition({ pool }) {
  const t = useTranslations()
  const { chainId } = useWallet()
  const pools = usePools()
  const { mutateManual } = useContext(ManualsContext)
  const incentiveMaker = getInsentiveContract(chainId)
  const farmingCenter = getFarmingCenterContract(chainId)
  const algebraFactory = getAlgebraFactoryContract(chainId)

  const [claimPopup, setClaimPopup] = useState(false)
  const [addPopup, setAddPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)

  const { asset0, asset1, liquidity, tickLower, tickUpper, tokenId } = pool
  const currency0 = useCurrency(asset0.address)
  const currency1 = useCurrency(asset1.address)

  // CALL APIs & SMART CONTRACTS
  const { onAlgebraBurn, pending } = useAlgebraBurn()
  const { onExitFarming, pending: isRemoveFarmLoading } = useAlgebraExitFarming()

  const { data: poolAddress } = useReadContract({
    ...algebraFactory,
    functionName: 'computePoolAddress',
    args: [asset0?.address, asset1?.address],
    query: {
      enabled: !!asset0 && !!asset1,
      staleTime: Infinity,
    },
  })

  const { data: key } = useReadContract({
    ...incentiveMaker,
    functionName: 'poolToKey',
    args: [poolAddress],
    query: {
      enabled: !!poolAddress,
      staleTime: Infinity,
    },
  })
  const { data: rewards } = useSimulateContract({
    ...farmingCenter,
    functionName: 'collectRewards',
    args: [key, pool?.tokenId],
    query: {
      enabled: !!key && !!pool?.tokenId,
    },
  })

  const poolFusion = useMemo(
    () =>
      pools.find(item => item?.address?.toLowerCase() === poolAddress?.toLowerCase() && item.title === 'CL_Farming'),
    [poolAddress, pools],
  )

  const fees = rewards?.result

  const tickAtLimit = useMemo(
    () => ({
      [Bound.LOWER]: tickLower ? tickLower === nearestUsableTick(TickMath.MIN_TICK, TICK_SPACING) : undefined,
      [Bound.UPPER]: tickUpper ? tickUpper === nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING) : undefined,
    }),
    [tickLower, tickUpper],
  )
  const [fusionState, fusion] = useFusionState(currency0, currency1)
  const [prevFusionState, prevFusion] = usePrevious([fusionState, fusion]) || []

  const [, _fusion] = useMemo(() => {
    if (!fusion && prevFusion && prevFusionState) {
      return [prevFusionState, prevFusion]
    }

    return [fusionState, fusion]
  }, [fusion, fusionState, prevFusion, prevFusionState])

  const position = useMemo(() => {
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

  const amount0 = useMemo(() => (position ? position.amount0.toExact() : 0), [position])
  const amount1 = useMemo(() => (position ? position.amount1.toExact() : 0), [position])
  const amount0InUsd = useMemo(() => BigNumber(amount0) * asset0.price, [amount0, asset0])
  const amount1InUsd = useMemo(() => BigNumber(amount1) * asset1.price, [amount1, asset1])

  const token0 = useToken(asset0.address)
  const token1 = useToken(asset1.address)
  const feeValue0 = useMemo(
    () => CurrencyAmount.fromRawAmount(unwrappedToken(token0), new BigNumber(fees ? fees[0] : 0).toString(10)),
    [token0, fees],
  )
  const feeValue1 = useMemo(
    () => CurrencyAmount.fromRawAmount(unwrappedToken(token1), new BigNumber(fees ? fees[1] : 0).toString(10)),
    [token1, fees],
  )

  const feesInUsd = useMemo(
    () =>
      fromWei(fees ? fees[0] : 0, asset0.decimals)
        .times(asset0.price)
        .plus(fromWei(fees ? fees[1] : 0, asset1.decimals).times(asset1.price)),
    [fees, asset0, asset1],
  )

  const fiatValueOfLiquidity = useMemo(() => amount0InUsd + amount1InUsd, [amount0InUsd, amount1InUsd])

  const firstPercent = useMemo(
    () => ((amount0InUsd / (amount0InUsd + amount1InUsd)) * 100).toFixed(2),
    [amount0InUsd, amount1InUsd],
  )

  const [reversePrice, setReversePrice] = useState(false)

  const outOfRange = _fusion ? _fusion.tickCurrent < tickLower || _fusion.tickCurrent >= tickUpper : false

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
              #{pool.tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
            </Paragraph>
          </div>
        </div>

        <GreenBadge>Farming</GreenBadge>

        {!Number(liquidity) ? (
          <YellowBadge>{t('Closed')}</YellowBadge>
        ) : outOfRange ? (
          <PrimaryBadge>{t('Out of Range')}</PrimaryBadge>
        ) : (
          <GreenBadge>{t('In Range')}</GreenBadge>
        )}
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-neutral-300'>{t('APR')}</span>
          <span>{formatAmount(poolFusion?.gauge?.apr || 0)}%</span>
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

        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Claimable Fees')}</Paragraph>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${tokenId}`} />
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
              {formatAmountLP(
                reversePrice
                  ? 1 / formatTickPrice(position?.token0PriceLower, tickAtLimit, Bound.LOWER)
                  : formatTickPrice(position?.token0PriceLower, tickAtLimit, Bound.LOWER),
              )}
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
              {formatAmountLP(
                reversePrice
                  ? 1 / formatTickPrice(position?.token0PriceUpper, tickAtLimit, Bound.UPPER)
                  : formatTickPrice(position?.token0PriceUpper, tickAtLimit, Bound.UPPER),
              )}
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
      </div>

      <div id='BUTTONS_GROUP' className='flex w-full gap-3'>
        <TextButton className='w-full' disabled={!fees || feesInUsd.isZero()} onClick={() => setClaimPopup(true)}>
          {t('Claim')}
        </TextButton>

        <TextButton
          className={cn('w-full', {
            hidden: !pool?.isFarming,
          })}
          disabled={!pool?.isFarming || isRemoveFarmLoading}
          onClick={() => onExitFarming({ poolkey: key, tokenId }, () => mutateManual())}
        >
          {t('Unstake')}
        </TextButton>

        <OutlinedButton
          className={cn('block w-full', {
            hidden: pool?.isFarming || Number(liquidity) <= 0,
          })}
          onClick={() => setRemovePopup(true)}
        >
          {t('Remove')}
        </OutlinedButton>

        <OutlinedButton
          className={cn('block w-full', {
            hidden: pool?.isFarming || Number(liquidity) > 0,
          })}
          onClick={() => onAlgebraBurn(tokenId, () => mutateManual())}
          disabled={pending}
        >
          {t('Burn')}
        </OutlinedButton>

        <EmphasisButton className='w-full' onClick={() => setAddPopup(true)}>
          {t('Add')}
        </EmphasisButton>
      </div>

      <ClaimModal
        popup={claimPopup}
        setPopup={setClaimPopup}
        pool={{ ...pool, key }}
        feeValue0={feeValue0}
        feeValue1={feeValue1}
        mutate={() => {}}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
      <RemoveManualModal
        popup={removePopup}
        setPopup={setRemovePopup}
        pool={pool}
        position={position}
        feeValue0={feeValue0}
        feeValue1={feeValue1}
        mutateManual={mutateManual}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
      <AddManualModal
        popup={addPopup}
        setPopup={setAddPopup}
        pool={pool}
        position={position}
        mutateManual={mutateManual}
        outOfRange={outOfRange}
        _fusion={_fusion}
        tickAtLimit={tickAtLimit}
      />
    </Box>
  )
}
