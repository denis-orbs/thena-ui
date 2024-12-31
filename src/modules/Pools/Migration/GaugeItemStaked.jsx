import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { GreenBadge } from '@/components/badges/Badge'
import { EmphasisButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'
import { AdjustNewPositionModal } from '@/modules/Pools/Migration'
import { InfoIcon } from '@/svgs'

export function GaugeItemStaked({ showAdjustButton = false, pool }) {
  const t = useTranslations()
  const [isOpenAdjust, setIsOpenAdjust] = useState(false)

  const token0Percent = useMemo(() => {
    const token0InUsd = pool.account.staked0.times(pool.token0.price)
    return token0InUsd.div(pool.account.stakedUsd).times(100).toFixed(2)
  }, [pool])

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
          <Paragraph className='text-sm'>{t('Claimable Amount')}</Paragraph>
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
