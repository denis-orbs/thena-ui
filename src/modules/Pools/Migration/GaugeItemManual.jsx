'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { nearestUsableTick, TICK_SPACING, TickMath } from 'thenafi-fusion-sdk'
import { maxUint128 } from 'viem'

import { GreenBadge, PrimaryBadge, YellowBadge } from '@/components/badges/Badge'
import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { simulateCall } from '@/lib/contractActions'
import { getPositionManagerContract } from '@/lib/contracts'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { cn, formatAmount, formatAmountLP, unwrappedSymbol } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import { RefreshIcon } from '@/svgs'

export const fetchManualInfo = async (account, tokenId, chainId) => {
  const algebraContract = getPositionManagerContract(chainId, 2)
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

export function GaugeItemManual({ existingPosition, position, fusion, version = 2, tickSpacing }) {
  const t = useTranslations()
  const [reversePrice, setReversePrice] = useState(false)
  const { asset0, asset1, liquidity, tickLower, tickUpper } = existingPosition

  const _tickSpacing = useMemo(() => tickSpacing ?? TICK_SPACING, [tickSpacing])

  const tickAtLimit = useMemo(
    () => ({
      [Bound.LOWER]: tickLower ? tickLower === nearestUsableTick(TickMath.MIN_TICK, _tickSpacing) : undefined,
      [Bound.UPPER]: tickUpper ? tickUpper === nearestUsableTick(TickMath.MAX_TICK, _tickSpacing) : undefined,
    }),
    [tickLower, tickUpper, _tickSpacing],
  )

  const amount0 = useMemo(() => position?.amount0?.toExact() ?? 0, [position])
  const amount1 = useMemo(() => position?.amount1?.toExact() ?? 0, [position])

  const amount0InUsd = useMemo(() => amount0 * asset0.price, [amount0, asset0])
  const amount1InUsd = useMemo(() => amount1 * asset1.price, [amount1, asset1])

  const fiatValueOfLiquidity = useMemo(() => amount0InUsd + amount1InUsd, [amount0InUsd, amount1InUsd])

  const firstPercent = useMemo(
    () => ((amount0InUsd / (amount0InUsd + amount1InUsd)) * 100).toFixed(2),
    [amount0InUsd, amount1InUsd],
  )

  const tickCurrent = position?.pool?.tickCurrent
  const fee = position?.pool?.fee

  const outOfRange = tickCurrent < tickLower && tickCurrent >= tickUpper

  const currentPrice = formatAmountLP(
    reversePrice ? 1 / (fusion?.token0Price.toSignificant(6) || 0) : fusion?.token0Price.toSignificant(6),
  )

  const minPrice = formatAmountLP(
    reversePrice
      ? 1 / formatTickPrice(position?.token0PriceLower, tickAtLimit, Bound.LOWER)
      : formatTickPrice(position?.token0PriceLower, tickAtLimit, Bound.LOWER),
  )

  const maxPrice = formatAmountLP(
    reversePrice
      ? 1 / formatTickPrice(position?.token0PriceUpper, tickAtLimit, Bound.UPPER)
      : formatTickPrice(position?.token0PriceUpper, tickAtLimit, Bound.UPPER),
  )

  return (
    <section className='flex h-full flex-col justify-start gap-3 rounded-xl border border-neutral-600 p-4 lg:p-6'>
      <div className='flex items-start justify-between'>
        <article className='flex items-center gap-3'>
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
              #{existingPosition.tokenId} / {fee / 10000}% {t('Fee')}
            </Paragraph>
          </div>
        </article>

        <span className={cn(version === 3 && 'hidden')}>
          {!Number(liquidity) ? (
            <YellowBadge>{t('Closed')}</YellowBadge>
          ) : outOfRange ? (
            <PrimaryBadge>{t('Out of Range')}</PrimaryBadge>
          ) : (
            <GreenBadge>{t('In Range')}</GreenBadge>
          )}
        </span>
      </div>

      <div className='flex flex-col gap-3'>
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
            {Number(existingPosition) > 0 && <TextSubHeading>{`(${formatAmount(firstPercent)}%)`}</TextSubHeading>}
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>
            {unwrappedSymbol(asset1)} {t('Deposit')}
          </Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(amount1)}`}</TextHeading>
            {Number(existingPosition) > 0 && <TextSubHeading>({formatAmount(100 - firstPercent)}%)</TextSubHeading>}
          </div>
        </div>

        <div className='gap-3 border-t border-t-neutral-600 py-3'>
          <div className='flex items-center gap-1'>
            <Paragraph className='text-sm'>{t('Price Range')}</Paragraph>
            <RefreshIcon
              className='size-4 cursor-pointer stroke-neutral-50'
              onClick={() => {
                setReversePrice(prev => !prev)
              }}
            />
          </div>

          <div className='flex flex-row justify-between'>
            <Paragraph>{t('Min Price')}</Paragraph>
            <div className='flex flex-row justify-between gap-1'>
              <TextHeading>{minPrice}</TextHeading>

              <Paragraph className='text-sm'>
                {t('[symbolA] per [symbolB]', {
                  symbolA: unwrappedSymbol(reversePrice ? asset0 : asset1),
                  symbolB: unwrappedSymbol(reversePrice ? asset1 : asset0),
                })}
              </Paragraph>
            </div>
          </div>
          <div className='flex flex-row justify-between'>
            <Paragraph>{t('Max Price')}</Paragraph>
            <div className='flex flex-row justify-between gap-1'>
              <TextHeading>{maxPrice}</TextHeading>
              <Paragraph className='text-sm'>
                {t('[symbolA] per [symbolB]', {
                  symbolA: unwrappedSymbol(reversePrice ? asset0 : asset1),
                  symbolB: unwrappedSymbol(reversePrice ? asset1 : asset0),
                })}
              </Paragraph>
            </div>
          </div>
          <div className='flex flex-row justify-between'>
            <Paragraph>{t('Current Price')}</Paragraph>
            {fusion ? (
              <div className='flex flex-row justify-between gap-1'>
                <TextHeading>{currentPrice}</TextHeading>
                <Paragraph className='text-sm'>
                  {t('[symbolA] per [symbolB]', {
                    symbolA: unwrappedSymbol(reversePrice ? asset0 : asset1),
                    symbolB: unwrappedSymbol(reversePrice ? asset1 : asset0),
                  })}
                </Paragraph>
              </div>
            ) : (
              <p>Not initiated yet</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
