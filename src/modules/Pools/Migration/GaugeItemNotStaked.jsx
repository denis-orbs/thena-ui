'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { PrimaryBadge } from '@/components/badges/Badge'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { formatAmount, ZERO_VALUE } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

export function GaugeItemNotStaked({ pool }) {
  const t = useTranslations()

  const walletUsd = useMemo(() => pool.account.totalUsd.minus(pool.account.stakedUsd), [pool])
  const token1Amount = useMemo(() => pool.account.total1.minus(pool.account.staked1), [pool])
  const token0Amount = useMemo(() => pool.account.total0.minus(pool.account.staked0), [pool])
  const token0Percent = useMemo(() => {
    const token0InUsd = token0Amount.times(pool.token0.price)
    return token0InUsd.div(walletUsd).times(100).toFixed(2)
  }, [walletUsd, token0Amount, pool])

  const feesInUsd = useMemo(() => {
    const fees0 = pool.account.token0claimable?.times(pool.token0.price) || ZERO_VALUE
    const fees1 = pool.account.token1claimable?.times(pool.token1.price) || ZERO_VALUE
    return fees0.plus(fees1)
  }, [pool])

  const isLegacy = useMemo(() => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(pool.title), [pool])
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
            <Paragraph className='text-sm'>{t('Claimable Amount')}</Paragraph>
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
      </div>
    </div>
  )
}
