import BigNumber from 'bignumber.js'
import React, { useContext, useMemo, useState } from 'react'
import useSWR from 'swr'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { maxUint128 } from 'viem'

import { GreenBadge, PrimaryBadge, YellowBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { ManualsContext } from '@/context/manualsContext'
import { useCurrency, useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraBurn } from '@/hooks/fusion/useAlgebra'
import { useFusion } from '@/hooks/fusion/useFusions'
import usePrevious from '@/hooks/usePrevious'
import { simulateCall } from '@/lib/contractActions'
import { getAlgebraNPMContract } from '@/lib/contracts'
import { unwrappedToken } from '@/lib/fusion'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { formatAmount, fromWei, unwrappedSymbol } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { Bound } from '@/state/fusion/actions'
import { InfoIcon } from '@/svgs'

import AddManualModal from './AddManualModal'
import ClaimModal from './ClaimModal'
import RemoveManualModal from './RemoveManualModal'

const fetchManualInfo = async (account, tokenId, chainId) => {
  const algebraContract = getAlgebraNPMContract(chainId)
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

export default function ManualPosition({ pool }) {
  const [claimPopup, setClaimPopup] = useState(false)
  const [addPopup, setAddPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)
  const { mutateManual } = useContext(ManualsContext)
  const { account, chainId } = useWallet()
  const { asset0, asset1, liquidity, tickLower, tickUpper, tokenId } = pool
  const { data: fees, mutate } = useSWR(
    account && tokenId ? ['manuals/fee', tokenId, account, chainId] : null,
    () => fetchManualInfo(account, tokenId, chainId),
    {
      refreshInterval: 60000,
    },
  )
  const { pending, onAlgebraBurn } = useAlgebraBurn()
  const currency0 = useCurrency(asset0.address)
  const currency1 = useCurrency(asset1.address)
  const [fusionState, fusion] = useFusion(currency0, currency1)
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

  const amount0InUsd = useMemo(() => amount0 * asset0.price, [amount0, asset0])
  const amount1InUsd = useMemo(() => amount1 * asset1.price, [amount1, asset1])

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
              #{pool.tokenId} / {(_fusion?.fee || 0) / 10000}% Fee
            </Paragraph>
          </div>
        </div>
        {!Number(liquidity) ? (
          <YellowBadge>Closed</YellowBadge>
        ) : outOfRange ? (
          <PrimaryBadge>Out of Range</PrimaryBadge>
        ) : (
          <GreenBadge>In Range</GreenBadge>
        )}
      </div>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>Total value in USD</Paragraph>
          <TextHeading>${formatAmount(fiatValueOfLiquidity)}</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{unwrappedSymbol(asset0)} deposit</Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(amount0)}`}</TextHeading>
            {Number(liquidity) > 0 && <TextSubHeading>{`(${formatAmount(firstPercent)}%)`}</TextSubHeading>}
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{unwrappedSymbol(asset1)} deposit</Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(amount1)}`}</TextHeading>
            {Number(liquidity) > 0 && <TextSubHeading>({formatAmount(100 - firstPercent)}%)</TextSubHeading>}
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>Claimable fees</Paragraph>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
            {feesInUsd.gt(0) && <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${tokenId}`} />}
            <CustomTooltip id={`net-${tokenId}`}>
              {fees && <p>{`${formatAmount(fromWei(fees[0], asset0.decimals))} ${unwrappedSymbol(asset0)}`}</p>}
              {fees && <p>{`${formatAmount(fromWei(fees[1], asset1.decimals))} ${unwrappedSymbol(asset1)}`}</p>}
            </CustomTooltip>
          </div>
        </div>
        <Paragraph className='text-sm'>Price Range</Paragraph>
        <div className='grid grid-cols-2 gap-4'>
          <div className='flex flex-col items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2'>
            <TextSubHeading className='text-xs'>Min Price</TextSubHeading>
            <TextHeading>{formatTickPrice(position?.token0PriceLower, tickAtLimit, Bound.LOWER)}</TextHeading>
            <Paragraph className='text-[10px]'>
              {unwrappedSymbol(asset1)} per {unwrappedSymbol(asset0)}
            </Paragraph>
          </div>
          <div className='flex flex-col items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2'>
            <TextSubHeading className='text-xs'>Max Price</TextSubHeading>
            <TextHeading>{formatTickPrice(position?.token0PriceUpper, tickAtLimit, Bound.UPPER)}</TextHeading>
            <Paragraph className='text-[10px]'>
              {unwrappedSymbol(asset1)} per {unwrappedSymbol(asset0)}
            </Paragraph>
          </div>
        </div>
        <div className='flex flex-col items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2'>
          <TextSubHeading className='text-xs'>Current Price</TextSubHeading>
          <TextHeading>{_fusion?.token0Price.toSignificant(6)}</TextHeading>
          <Paragraph className='text-[10px]'>
            {unwrappedSymbol(asset1)} per {unwrappedSymbol(asset0)}
          </Paragraph>
        </div>
      </div>
      <div className='flex w-full gap-3'>
        <TextButton className='w-full' disabled={!fees || feesInUsd.isZero()} onClick={() => setClaimPopup(true)}>
          Claim
        </TextButton>
        {Number(liquidity) > 0 ? (
          <OutlinedButton className='w-full' onClick={() => setRemovePopup(true)}>
            Remove
          </OutlinedButton>
        ) : (
          <OutlinedButton
            className='w-full'
            onClick={() => onAlgebraBurn(tokenId, () => mutateManual())}
            disabled={pending}
          >
            Burn
          </OutlinedButton>
        )}
        <EmphasisButton className='w-full' onClick={() => setAddPopup(true)}>
          Add
        </EmphasisButton>
      </div>
      <ClaimModal
        popup={claimPopup}
        setPopup={setClaimPopup}
        pool={pool}
        feeValue0={feeValue0}
        feeValue1={feeValue1}
        mutate={mutate}
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
