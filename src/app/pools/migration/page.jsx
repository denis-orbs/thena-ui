'use client'

import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thena-fusion-sdk'
import { maxUint128 } from 'viem'

import { GreenBadge, PrimaryBadge, YellowBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useFusion } from '@/hooks/fusion/useFusions'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import { simulateCall } from '@/lib/contractActions'
import { getAlgebraNPMContract } from '@/lib/contracts'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { formatAmount, formatAmountLP, fromWei, unwrappedSymbol, ZERO_VALUE } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import { ArrowLeftIcon, ArrowNarrowUpRightIcon, ArrowRightIcon, InfoIcon, RefreshIcon } from '@/svgs'

import AdjustNewPositionModal from './AdjustNewPositionModal'

// const migration = 'alm'
// // const migrationType = 'staked'
// const migrationType = 'notStaked'

// const migration = 'manual'
// // const migrationType = 'in'
// const migrationType = 'out'

const pool = {
  asset0: {
    name: 'Binance Pegged USDT',
    symbol: 'USDT',
    address: '0x55d398326f99059fF775485246999027B3197955',
    chainId: 56,
    decimals: 18,
    logoURI: 'https://tokens.pancakeswap.finance/images/0x55d398326f99059fF775485246999027B3197955.png',
    price: 0.9992,
    extended: true,
    balance: '17.699945694096753105',
  },
  asset1: {
    name: 'WBNB Token',
    symbol: 'WBNB',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    chainId: 56,
    decimals: 18,
    logoURI: 'https://tokens.pancakeswap.finance/images/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c.png',
    price: 588.63,
    extended: true,
    balance: '0.01000014',
  },
  liquidity: 85480870248456518n,
  symbol: 'USDT/WBNB',
  tickLower: -65880,
  tickUpper: -61800,
  token0Address: '0x55d398326f99059fF775485246999027B3197955',
  token1Address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  tokenId: 5836,
  type: 'Manual',
}

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

function GaugeItemManual({ showAdjustButton = false }) {
  const { account, chainId } = useWallet()
  const { asset0, asset1, liquidity, tickLower, tickUpper, tokenId } = pool
  const { data: fees } = useSWR(
    account && tokenId ? ['manuals/fee', tokenId, account, chainId] : null,
    () => fetchManualInfo(account, tokenId, chainId),
    {
      refreshInterval: 60000,
    },
  )
  const t = useTranslations()
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

  const [isOpenAdjust, setIsOpenAdjust] = useState(false)

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
    <div className='flex h-full flex-col justify-start gap-3 rounded-xl border border-neutral-600 p-4 lg:p-6'>
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
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Claimable Fees')}</Paragraph>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
            {feesInUsd.gt(0) && <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${tokenId}`} />}
            <CustomTooltip id={`net-${tokenId}`}>
              {fees && <p>{`${formatAmount(fromWei(fees[0], asset0.decimals))} ${unwrappedSymbol(asset0)}`}</p>}
              {fees && <p>{`${formatAmount(fromWei(fees[1], asset1.decimals))} ${unwrappedSymbol(asset1)}`}</p>}
            </CustomTooltip>
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
    </div>
  )
}

function GaugeItemStaked({ showAdjustButton = false }) {
  const t = useTranslations()
  const [isOpenAdjust, setIsOpenAdjust] = useState(false)

  const token0Percent = useMemo(() => {
    const token0InUsd = pool.account.staked0.times(pool.token0.price)
    return token0InUsd.div(pool.account.stakedUsd).times(100).toFixed(2)
  }, [])
  return (
    <div className='flex h-full flex-col justify-start gap-3 rounded-xl border border-neutral-600 p-4 lg:p-6'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <IconGroup
            className='-space-x-2'
            classNames={{ image: 'w-8 h-8 outline-2' }}
            logo1={pool.token0.logoURI}
            logo2={pool.token1.logoURI}
          />
          <div className='flex flex-col'>
            <TextHeading>{pool.symbol}</TextHeading>
            <TextSubHeading>{pool.title}</TextSubHeading>
          </div>
        </div>
        <GreenBadge>{t('Staked')}</GreenBadge>
      </div>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('APR')}</Paragraph>
          <TextHeading>{formatAmount(pool.gauge.apr)}%</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Deposit Value in USD')}</Paragraph>
          <TextHeading>${formatAmount(pool.account.stakedUsd)}</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>
            {pool.token0.symbol} {t('Deposit')}
          </Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(pool.account.staked0)}`}</TextHeading>
            <TextSubHeading>{`(${formatAmount(token0Percent)}%)`}</TextSubHeading>
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>
            {pool.token1.symbol} {t('Deposit')}
          </Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(pool.account.staked1)}`}</TextHeading>
            <TextSubHeading>({formatAmount(100 - token0Percent)}%)</TextSubHeading>
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Net Return')}</Paragraph>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(pool.account.earnedUsd)}</TextHeading>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${pool.address}`} />
            <CustomTooltip id={`net-${pool.address}`}>
              {pool.account.gaugeEarned && <p>{`${formatAmount(pool.account.gaugeEarned)} THE`}</p>}
              {pool.account.earned0 && <p>{`${formatAmount(pool.account.earned0)} ${pool.token0.symbol}`}</p>}
              {pool.account.earned1 && <p>{`${formatAmount(pool.account.earned1)} ${pool.token1.symbol}`}</p>}
              {pool.account.earned2 && <p>{`${formatAmount(pool.account.earned2)} ${pool.reward.symbol}`}</p>}
              {pool.account.extraRewards && (
                <p>{`${formatAmount(pool.account.extraRewards.amount)} ${pool.account.extraRewards.symbol}`}</p>
              )}
            </CustomTooltip>
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
    </div>
  )
}

function GaugeItemNotStaked({ showAdjustButton = false }) {
  const t = useTranslations()
  const [isOpenAdjust, setIsOpenAdjust] = useState(false)

  const walletUsd = useMemo(() => pool.account.totalUsd.minus(pool.account.stakedUsd), [])
  const token1Amount = useMemo(() => pool.account.total1.minus(pool.account.staked1), [])
  const token0Amount = useMemo(() => pool.account.total0.minus(pool.account.staked0), [])
  const token0Percent = useMemo(() => {
    const token0InUsd = token0Amount.times(pool.token0.price)
    return token0InUsd.div(walletUsd).times(100).toFixed(2)
  }, [walletUsd, token0Amount])

  const feesInUsd = useMemo(() => {
    const fees0 = pool.account.token0claimable?.times(pool.token0.price) || ZERO_VALUE
    const fees1 = pool.account.token1claimable?.times(pool.token1.price) || ZERO_VALUE
    return fees0.plus(fees1)
  }, [])

  const isLegacy = useMemo(() => ['Stable', 'Volatile'].includes(pool.title), [])
  return (
    <div>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <IconGroup
            className='-space-x-2'
            classNames={{ image: 'w-8 h-8 outline-2' }}
            logo1={pool.token0.logoURI}
            logo2={pool.token1.logoURI}
          />
          <div className='flex flex-col'>
            <TextHeading>{pool.symbol}</TextHeading>
            <TextSubHeading>{pool.title}</TextSubHeading>
          </div>
        </div>
        <PrimaryBadge>{t('Not Staked')}</PrimaryBadge>
      </div>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>APR</Paragraph>
          <TextHeading>{formatAmount(pool.gauge.apr)}%</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Deposit Value in USD')}</Paragraph>
          <TextHeading>${formatAmount(pool.account.totalUsd.minus(pool.account.stakedUsd))}</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>
            {pool.token0.symbol} {t('Deposit')}
          </Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(token0Amount)}`}</TextHeading>
            <TextSubHeading>{`(${formatAmount(token0Percent)}%)`}</TextSubHeading>
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>
            {pool.token1.symbol} {t('Deposit')}
          </Paragraph>
          <div className='flex gap-1'>
            <TextHeading>{`${formatAmount(token1Amount)}`}</TextHeading>
            <TextSubHeading>({formatAmount(100 - token0Percent)}%)</TextSubHeading>
          </div>
        </div>
        {isLegacy && (
          <div className='flex items-center justify-between'>
            <Paragraph className='text-sm'>{t('Claimable Fees')}</Paragraph>
            <div className='flex items-center gap-1'>
              <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
              <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${pool.address}`} />
              <CustomTooltip id={`net-${pool.address}`}>
                {pool.account.token0claimable && (
                  <p>{`${formatAmount(pool.account.token0claimable)} ${pool.token0.symbol}`}</p>
                )}
                {pool.account.token1claimable && (
                  <p>{`${formatAmount(pool.account.token1claimable)} ${pool.token1.symbol}`}</p>
                )}
              </CustomTooltip>
            </div>
          </div>
        )}
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
  )
}

// TODO: Replace mock data

export default function MigrationPage() {
  const t = useTranslations()
  const { push } = useRouter()
  return (
    <div className='mx-auto flex flex-col lg:flex-row'>
      <div className='h-11 w-[98px]'>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/pools')}>
          {t('Back')}
        </TextButton>
      </div>
      <Box className='rounded-xl bg-neutral-900 px-3 py-6 lg:px-7'>
        <div className='flex flex-col gap-2'>
          <TextHeading className='font-archia text-3xl'>{t('Migration')}</TextHeading>
          <TextSubHeading className='text-base text-neutral-300'>
            {t('Migration description')}&nbsp;
            <span className='flex items-center text-primary-600'>
              {t('KyberSwap migration contract')}&nbsp;
              <ArrowNarrowUpRightIcon className='h-3 w-3 !stroke-primary-600' />
            </span>
          </TextSubHeading>
        </div>
        <div className='mt-4 grid items-stretch gap-4 lg:grid-cols-[48%_2%_48%]'>
          <div className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your Current Gauge')}</TextHeading>
            {pool.type === 'Manual' ? (
              <GaugeItemManual />
            ) : (
              <>
                {pool.account.walletBalance.gt(0) && <GaugeItemNotStaked />}
                {pool.account.gaugeBalance.gt(0) && <GaugeItemStaked />}
              </>
            )}
          </div>
          <div className='flex items-center justify-center'>
            <ArrowRightIcon className='mx-auto h-5 w-5 max-lg:rotate-90' />
          </div>
          <div className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your New V3 Gauge')}</TextHeading>
            {pool.type === 'Manual' ? (
              <GaugeItemManual showAdjustButton />
            ) : (
              <>
                {pool.account.walletBalance.gt(0) && <GaugeItemNotStaked showAdjustButton />}
                {pool.account.gaugeBalance.gt(0) && <GaugeItemStaked showAdjustButton />}
              </>
            )}
          </div>
        </div>

        <Box className='mt-[30px] flex flex-row items-center justify-between gap-4 border border-primary-800 bg-primary-950'>
          <TextHeading className='text-neutral-100'>{t('During the migration all rewards will be')}</TextHeading>
        </Box>
        <div className='mt-6 flex flex-col justify-between gap-3 lg:flex-row'>
          <EmphasisButton className='w-full lg:w-[50%]'>{t('Cancel')}</EmphasisButton>
          <PrimaryButton className='w-full lg:w-[50%]'>{t('Migrate Now')}</PrimaryButton>
        </div>
      </Box>
    </div>
  )
}
