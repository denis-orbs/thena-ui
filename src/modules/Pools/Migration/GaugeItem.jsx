'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { NeutralBadge, PrimaryBadge } from '@/components/badges/Badge'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { POSITION_EARNED_TYPES } from '@/constant'
import { cn, formatAmount, getDisplayedStrategy } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

export function GaugeItem({ pool, strategy, staked = false, strategyType = 'V1' }) {
  const t = useTranslations()

  const depositValueUSD = useMemo(
    () => (staked ? pool.account.stakedUsd : pool.account.totalUsd.minus(pool.account.stakedUsd)),
    [pool, staked],
  )
  const token0Amount = useMemo(
    () => (staked ? pool.account.staked0 : pool.account.total0.minus(pool.account.staked0)),
    [pool, staked],
  )
  const token1Amount = useMemo(
    () => (staked ? pool.account.staked1 : pool.account.total1.minus(pool.account.staked1)),
    [pool, staked],
  )

  const token0Percent = useMemo(() => {
    const token0InUsd = token0Amount.times(pool.token0.price)
    return Number(depositValueUSD) > 0 ? token0InUsd.div(depositValueUSD).times(100).toFixed(2) : 0
  }, [depositValueUSD, token0Amount, pool])

  const otherToken = useMemo(() => {
    if (!strategy?.allowed) return null

    if (strategy.allowed.address === pool.token0.address) {
      return {
        ...pool.token1,
        amount: token1Amount,
        swapToAmount: (token1Amount * pool.token1.price) / strategy.allowed.price,
      }
    }
    return {
      ...pool.token0,
      amount: token0Amount,
      swapToAmount: (token0Amount * pool.token0.price) / strategy.allowed.price,
    }
  }, [strategy?.allowed, pool?.token0, pool?.token1, token0Amount, token1Amount])

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
            <TextSubHeading>{getDisplayedStrategy(pool.title)}</TextSubHeading>
          </div>
        </div>
        <PrimaryBadge
          className={cn(
            'text-xs',
            strategy && strategyType !== 'V1' && 'hidden',
            staked && 'bg-success-600 text-success-100',
          )}
        >
          {t(staked ? 'Staked' : 'Not Staked')}
        </PrimaryBadge>

        <NeutralBadge className={cn('hidden', strategy && strategyType !== 'V1' && 'block')}>
          {strategy?.isFarming ? POSITION_EARNED_TYPES.EARN_THE : POSITION_EARNED_TYPES.EARN_FEE}
        </NeutralBadge>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>APR</Paragraph>
          <TextHeading>{formatAmount(strategy?.gauge?.apr ?? pool.gauge.apr)}%</TextHeading>
        </div>

        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Deposit Value in USD')}</Paragraph>
          <TextHeading>
            {strategy && strategyType !== 'V1' ? '≈' : ''} ${formatAmount(depositValueUSD)}
          </TextHeading>
        </div>

        {!strategy ? (
          // POSITION V2 INFO
          <>
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
          </>
        ) : strategyType === 'V1' ? (
          // Classic/Stable gauge V3 info
          <>
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
          </>
        ) : strategy?.allowed ? (
          // ICHI V3 INFO
          <>
            <div className='flex items-center justify-between'>
              <Paragraph className='text-sm'>Swap</Paragraph>
              <div className='flex gap-1'>
                <TextHeading>
                  {otherToken?.amount.toFixed(6)} {otherToken?.symbol} to {otherToken?.swapToAmount.toFixed(6)}{' '}
                  {strategy?.allowed?.symbol}
                </TextHeading>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <Paragraph className='text-sm'>
                {strategy?.allowed?.symbol} {t('Deposit')}
              </Paragraph>
              <div className='flex gap-1'>
                <TextHeading>
                  {`${
                    strategy.allowed.address === pool.token0.address ? token0Amount.toFixed(6) : token1Amount.toFixed(6)
                  }`}{' '}
                  + {`${otherToken?.swapToAmount.toFixed(6)}`}
                </TextHeading>
              </div>
            </div>
          </>
        ) : // Gamma V3 position (preview nothing for now)
        null}
      </div>

      <div className={cn('flex items-center justify-between', strategy && 'hidden')}>
        <Paragraph className='text-sm'>{t('Claimable Amount')}</Paragraph>
        <div className='flex items-center gap-1'>
          <TextHeading>${formatAmount(pool.account.earnedUsd)}</TextHeading>
          <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${pool.address}`} />
          <CustomTooltip id={`net-${pool.address}`}>
            {pool.account.gaugeEarned && <p>{`${formatAmount(pool.account.gaugeEarned)} THE`}</p>}
            {pool.account.earned0 && <p>{`${formatAmount(pool.account.earned0)} ${pool.token0.symbol}`}</p>}
            {pool.account.earned1 && <p>{`${formatAmount(pool.account.earned1)} ${pool.token1.symbol}`}</p>}
            {pool.account.earned2 && <p>{`${formatAmount(pool.account.earned2)} ${pool.reward.symbol}`}</p>}
          </CustomTooltip>
        </div>
      </div>
    </div>
  )
}
