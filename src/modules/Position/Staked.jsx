import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { GreenBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useGuageHarvset, useGuageUnstake } from '@/hooks/useGauge'
import { formatAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import AddPositionModal from './AddPositionModal'
import GaugeManageModal from './GaugeManageModal'

export default function Staked({ pool }) {
  const [popup, setPopup] = useState(false)
  const [addPopup, setAddPopup] = useState(false)
  const { onGaugeUnstake, pending: unstakePending } = useGuageUnstake()
  const { onGaugeHarvest, pending } = useGuageHarvset()
  const t = useTranslations()

  const token0Percent = useMemo(() => {
    const token0InUsd = pool.account.staked0.times(pool.token0.price)
    return token0InUsd.div(pool.account.stakedUsd).times(100).toFixed(2)
  }, [pool])

  return (
    <Box className='flex flex-col gap-4'>
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
              {pool.account.earned2 && <p>{`${formatAmount(pool.account.earned2)} THE`}</p>}
              {pool.account.extraRewards && (
                <p>{`${formatAmount(pool.account.extraRewards.amount)} ${pool.account.extraRewards.symbol}`}</p>
              )}
            </CustomTooltip>
          </div>
        </div>
      </div>
      <div className='mt-auto flex w-full gap-3'>
        <TextButton className='w-full' onClick={() => setPopup(true)}>
          {t('Unstake')}
        </TextButton>
        <OutlinedButton
          className='w-full'
          onClick={() => onGaugeHarvest(pool)}
          disabled={pending || pool.account.earnedUsd.isZero()}
        >
          {t('Harvest')}
        </OutlinedButton>
        <EmphasisButton
          className='w-full'
          onClick={() => {
            setAddPopup(true)
          }}
        >
          {t('Add')}
        </EmphasisButton>
      </div>
      <GaugeManageModal
        title='Unstake LP'
        pair={pool}
        balance={pool.account.gaugeBalance}
        label='Unstake'
        popup={popup}
        setPopup={setPopup}
        onGaugeManage={onGaugeUnstake}
        pending={unstakePending}
      />
      <AddPositionModal popup={addPopup} setPopup={setAddPopup} strategy={pool} />
    </Box>
  )
}
