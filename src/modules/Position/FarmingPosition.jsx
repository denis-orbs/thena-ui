import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useContext, useMemo, useState } from 'react'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { maxUint128, zeroAddress } from 'viem'
import { useReadContract, useSimulateContract } from 'wagmi'

import { GreenBadge, PrimaryBadge, YellowBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import Contracts from '@/constant/contracts'
import { ManualsContext } from '@/context/manualsContext'
import { useCurrency, useGetAsset, useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraBurn } from '@/hooks/fusion/useAlgebra'
import { useCalculateAPR } from '@/hooks/fusion/useEstimateAPR'
import { useFusionState } from '@/hooks/fusion/useFusions'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import { getFarmingCenterContract, getInsentiveContract, getPositionManagerContract } from '@/lib/contracts'
import { unwrappedToken } from '@/lib/fusion'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { cn, formatAmount, formatAmountLP, fromWei, unwrappedSymbol } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import { usePools } from '@/state/pools/hooks'
import { InfoIcon, RefreshIcon } from '@/svgs'

import AddManualModal from './AddManualModal'
import ClaimModal from './ClaimModal'
import { WarningOutOfRange } from './ManualPosition'
import RemoveManualModal from './RemoveManualModal'

export function FarmingPosition({ position }) {
  const t = useTranslations()
  const { account, chainId } = useWallet()
  const pools = usePools()
  const { mutateManual } = useContext(ManualsContext)
  const incentiveMaker = getInsentiveContract(chainId)
  const farmingCenter = getFarmingCenterContract(chainId)
  const positionManagerContract = getPositionManagerContract(chainId, position.version)

  const [claimPopup, setClaimPopup] = useState(false)
  const [addPopup, setAddPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)

  const { asset0, asset1, liquidity, tickLower, tickUpper, tokenId } = position
  const currency0 = useCurrency(asset0.address)
  const currency1 = useCurrency(asset1.address)

  // CALL APIs & SMART CONTRACTS
  const { onAlgebraBurn, pending } = useAlgebraBurn()
  // const { onExitFarming, pending: isRemoveFarmLoading } = useAlgebraExitFarming()

  const [fusionState, fusion, poolAddress] = useFusionState({
    currencyA: currency0,
    currencyB: currency1,
    isFarmingPool: position?.deployer === zeroAddress,
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

  const { data: farmRewards } = useSimulateContract({
    ...farmingCenter,
    functionName: 'collectRewards',
    args: [key, position?.tokenId],
    query: {
      enabled: !!key && !!position?.tokenId,
    },
  })

  const { data: feeRewards } = useSimulateContract({
    ...positionManagerContract,
    functionName: 'collect',
    args: [
      {
        tokenId,
        recipient: account,
        amount0Max: maxUint128,
        amount1Max: maxUint128,
      },
    ],
    query: {
      enabled: !!key && !!position?.tokenId,
    },
  })
  const farmRewardData = farmRewards?.result
  const feeRewardData = feeRewards?.result

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
  const token0 = useToken(asset0.address)
  const token1 = useToken(asset1.address)

  const poolInfo = useMemo(
    () =>
      pools.find(item => item?.address?.toLowerCase() === poolAddress?.toLowerCase() && item.title === 'CL_Farming'),
    [poolAddress, pools],
  )
  const apr = useCalculateAPR({
    position,
    poolAddress,
    totalLiquidity: _fusion?.liquidity,
    tvl: poolInfo?.tlv ?? 1,
  })

  const THE = useGetAsset(Contracts.THE[chainId])
  const WBNB = useGetAsset(Contracts.WBNB[chainId])

  const feeThe = useMemo(
    () => CurrencyAmount.fromRawAmount(THE, new BigNumber(farmRewardData ? farmRewardData[0] : 0).toString(10)),
    [THE, farmRewardData],
  )
  const feeWbnb = useMemo(
    () => CurrencyAmount.fromRawAmount(WBNB, new BigNumber(farmRewardData ? farmRewardData[1] : 0).toString(10)),
    [WBNB, farmRewardData],
  )

  const feeValue0 = useMemo(
    () =>
      CurrencyAmount.fromRawAmount(
        unwrappedToken(token0),
        new BigNumber(feeRewardData ? feeRewardData[0] : 0).toString(10),
      ),
    [token0, feeRewardData],
  )
  const feeValue1 = useMemo(
    () =>
      CurrencyAmount.fromRawAmount(
        unwrappedToken(token1),
        new BigNumber(feeRewardData ? feeRewardData[1] : 0).toString(10),
      ),
    [token1, feeRewardData],
  )

  const feesInUsd = useMemo(() => {
    let usdFee = new BigNumber(0)

    if (farmRewardData) {
      usdFee = usdFee
        .plus(fromWei(farmRewardData[0]).times(THE.price))
        .plus(fromWei(farmRewardData[1]).times(WBNB.price))
    }

    if (feeRewardData) {
      usdFee = usdFee
        .plus(fromWei(feeRewardData[0], asset0.decimalse).times(asset0.price))
        .plus(fromWei(feeRewardData[1], asset1.decimalse).times(asset0.price))
    }

    return usdFee
  }, [farmRewardData, THE.price, WBNB.price, feeRewardData, asset0.decimalse, asset0.price, asset1.decimalse])

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
              #{position.tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
            </Paragraph>
          </div>
        </div>

        <div className='flex flex-wrap justify-end gap-2'>
          <GreenBadge>$THE + 10% Fees</GreenBadge>

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
          <span>{apr.toFixed(2)}%</span>
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
          <Paragraph className='text-sm'>{t('Claimable Amount')}</Paragraph>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${tokenId}`} />
            <CustomTooltip id={`net-${tokenId}`}>
              {farmRewardData?.[0] && <p>{`${formatAmount(fromWei(farmRewardData[0], 18))} THE`}</p>}
              {farmRewardData?.[1] && <p>{`${formatAmount(fromWei(farmRewardData[1], 18))} WBNB`}</p>}
              {feeRewardData?.[0] && (
                <p>{`${formatAmount(fromWei(feeRewardData[0], asset0.decimals))} ${unwrappedSymbol(asset0)}`}</p>
              )}
              {feeRewardData?.[1] && (
                <p>{`${formatAmount(fromWei(feeRewardData[1], asset1.decimals))} ${unwrappedSymbol(asset1)}`}</p>
              )}
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
                  ? 1 / formatTickPrice(_position?.token0PriceLower, tickAtLimit, Bound.LOWER)
                  : formatTickPrice(_position?.token0PriceLower, tickAtLimit, Bound.LOWER),
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
                  ? 1 / formatTickPrice(_position?.token0PriceUpper, tickAtLimit, Bound.UPPER)
                  : formatTickPrice(_position?.token0PriceUpper, tickAtLimit, Bound.UPPER),
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

        <TextButton className='w-full' disabled={feesInUsd.isZero()} onClick={() => setClaimPopup(true)}>
          {t('Claim')}
        </TextButton>

        <OutlinedButton
          className={cn('block w-full', {
            hidden: position?.isFarming || Number(liquidity) > 0,
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
        pool={{ ...position, key }}
        feeValue0={feeValue0}
        feeValue1={feeValue1}
        additionRewards={[feeThe, feeWbnb]}
        mutate={() => {}}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
      <RemoveManualModal
        popup={removePopup}
        setPopup={setRemovePopup}
        pool={position}
        position={_position}
        feeValue0={feeValue0}
        feeValue1={feeValue1}
        additionRewards={[feeThe, feeWbnb]}
        mutateManual={mutateManual}
        outOfRange={outOfRange}
        fee={_fusion?.fee || 0}
      />
      <AddManualModal
        popup={addPopup}
        setPopup={setAddPopup}
        pool={position}
        position={_position}
        mutateManual={mutateManual}
        outOfRange={outOfRange}
        _fusion={_fusion}
        tickAtLimit={tickAtLimit}
      />
    </Box>
  )
}
