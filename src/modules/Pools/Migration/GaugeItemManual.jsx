'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { maxUint128 } from 'viem'

import { GreenBadge, PrimaryBadge, YellowBadge } from '@/components/badges/Badge'
import { EmphasisButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useFusion } from '@/hooks/fusion/useFusions'
import usePrevious from '@/hooks/usePrevious'
import { simulateCall } from '@/lib/contractActions'
import { getAlgebraNPMContract } from '@/lib/contracts'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { formatAmount, formatAmountLP, unwrappedSymbol } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import { RefreshIcon } from '@/svgs'

import { AdjustNewPositionModal } from './AdjustNewPositionModal'

export const fetchManualInfo = async (account, tokenId, chainId) => {
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

export function GaugeItemManual({ showAdjustButton = false, positionV2, version = 2 }) {
  const t = useTranslations()
  const [isOpenAdjust, setIsOpenAdjust] = useState(false)

  const { asset0, asset1, liquidity, tickLower, tickUpper } = positionV2
  const currency0 = useCurrency(asset0.address)
  const currency1 = useCurrency(asset1.address)

  // const { account, chainId } = useWallet()
  // const { data: fees } = useSWR(
  //   account && tokenId ? ['manuals/fee', tokenId, account, chainId] : null,
  //   () => fetchManualInfo(account, tokenId, chainId),
  //   {
  //     refreshInterval: 60000,
  //   },
  // )

  const [fusionState, fusion] = useFusion(currency0, currency1, version)
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

  /**
   * @typedef {Object} Position
   * @property {Object} pool - The pool object associated with the position.
   * @property {BigNumber} liquidity - The liquidity of the position.
   * @property {number} tickLower - The lower tick of the position.
   * @property {number} tickUpper - The upper tick of the position.
   * @property {Object} amount0 - The amount of token 0 in the position.
   * @property {Object} amount1 - The amount of token 1 in the position.
   */
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

  // const token0 = useToken(asset0.address)
  // const token1 = useToken(asset1.address)
  // const feeValue0 = useMemo(
  //   () => CurrencyAmount.fromRawAmount(unwrappedToken(token0), new BigNumber(fees ? fees[0] : 0).toString(10)),
  //   [token0, fees],
  // )
  // const feeValue1 = useMemo(
  //   () => CurrencyAmount.fromRawAmount(unwrappedToken(token1), new BigNumber(fees ? fees[1] : 0).toString(10)),
  //   [token1, fees],
  // )

  // const feesInUsd = useMemo(
  //   () =>
  //     fromWei(fees ? fees[0] : 0, asset0.decimals)
  //       .times(asset0.price)
  //       .plus(fromWei(fees ? fees[1] : 0, asset1.decimals).times(asset1.price)),
  //   [fees, asset0, asset1],
  // )

  const fiatValueOfLiquidity = useMemo(() => amount0InUsd + amount1InUsd, [amount0InUsd, amount1InUsd])

  const firstPercent = useMemo(
    () => ((amount0InUsd / (amount0InUsd + amount1InUsd)) * 100).toFixed(2),
    [amount0InUsd, amount1InUsd],
  )

  const [reversePrice, setReversePrice] = useState(false)

  const outOfRange = _fusion ? _fusion.tickCurrent < tickLower || _fusion.tickCurrent >= tickUpper : false

  return (
    <section className='flex h-full flex-col justify-start gap-3 rounded-xl border border-neutral-600 p-4 lg:p-6'>
      <div className='flex items-start justify-between'>
        <article className='flex items-center gap-3'>
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
              #{positionV2.tokenId} / {(_fusion?.fee || 0) / 10000}% {t('Fee')}
            </Paragraph>
          </div>
        </article>

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

        {/* <div className='flex items-center justify-between'> */}
        {/*   <Paragraph className='text-sm'>{t('Claimable Fees')}</Paragraph> */}
        {/*   <div className='flex items-center gap-1'> */}
        {/*     <TextHeading>${formatAmount(feesInUsd)}</TextHeading> */}
        {/*     {feesInUsd.gt(0) && <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${tokenId}`} />} */}
        {/*     <CustomTooltip id={`net-${tokenId}`}> */}
        {/*       {fees && <p>{`${formatAmount(fromWei(fees[0], asset0.decimals))} ${unwrappedSymbol(asset0)}`}</p>} */}
        {/*       {fees && <p>{`${formatAmount(fromWei(fees[1], asset1.decimals))} ${unwrappedSymbol(asset1)}`}</p>} */}
        {/*     </CustomTooltip> */}
        {/*   </div> */}
        {/* </div> */}

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
              <TextHeading>
                {formatAmountLP(
                  reversePrice
                    ? 1 / formatTickPrice(position?.token0PriceLower, tickAtLimit, Bound.LOWER)
                    : formatTickPrice(position?.token0PriceLower, tickAtLimit, Bound.LOWER),
                )}
              </TextHeading>
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
              <TextHeading>
                {formatAmountLP(
                  reversePrice
                    ? 1 / formatTickPrice(position?.token0PriceUpper, tickAtLimit, Bound.UPPER)
                    : formatTickPrice(position?.token0PriceUpper, tickAtLimit, Bound.UPPER),
                )}
              </TextHeading>
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
            <div className='flex flex-row justify-between gap-1'>
              <TextHeading>
                {formatAmountLP(
                  reversePrice
                    ? 1 / (_fusion?.token0Price.toSignificant(6) || 0)
                    : _fusion?.token0Price.toSignificant(6),
                )}
              </TextHeading>
              <Paragraph className='text-sm'>
                {t('[symbolA] per [symbolB]', {
                  symbolA: unwrappedSymbol(reversePrice ? asset0 : asset1),
                  symbolB: unwrappedSymbol(reversePrice ? asset1 : asset0),
                })}
              </Paragraph>
            </div>
          </div>

          {showAdjustButton && (
            <>
              <EmphasisButton onClick={() => setIsOpenAdjust(true)} className='mt-3 w-full'>
                {t('Adjust New Position')}
              </EmphasisButton>
              <AdjustNewPositionModal isOpen={isOpenAdjust} onClose={() => setIsOpenAdjust(false)} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
