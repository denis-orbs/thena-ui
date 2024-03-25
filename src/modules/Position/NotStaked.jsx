import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { PrimaryBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useGuageStake } from '@/hooks/useGauge'
import { useClaimFees } from '@/hooks/useV1Liquidity'
import { formatAmount, ZERO_VALUE } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import AddPositionModal from './AddPositionModal'
import GaugeManageModal from './GaugeManageModal'
import ManagePositionModal from './ManagePositionModal'
import RemovePositionModal from './RemovePositionModal'

export default function NotStaked({ pool }) {
  const [popup, setPopup] = useState(false)
  const [addPopup, setAddPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)
  const [managePopup, setManagePopup] = useState(false)
  const { onGaugeStake, pending: stakePending } = useGuageStake()
  const { onClaimFees, pending: feesPending } = useClaimFees()
  const t = useTranslations()

  const walletUsd = useMemo(() => pool.account.totalUsd.minus(pool.account.stakedUsd), [pool])
  const token0Amount = useMemo(() => pool.account.total0.minus(pool.account.staked0), [pool])
  const token1Amount = useMemo(() => pool.account.total1.minus(pool.account.staked1), [pool])
  const token0Percent = useMemo(() => {
    const token0InUsd = token0Amount.times(pool.token0.price)
    return token0InUsd.div(walletUsd).times(100).toFixed(2)
  }, [walletUsd, token0Amount, pool])

  const feesInUsd = useMemo(() => {
    const fees0 = pool.account.token0claimable?.times(pool.token0.price) || ZERO_VALUE
    const fees1 = pool.account.token1claimable?.times(pool.token1.price) || ZERO_VALUE
    return fees0.plus(fees1)
  }, [pool])

  const isLegacy = useMemo(() => ['Stable', 'Volatile'].includes(pool.title), [pool])

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
      </div>
      <div className='mt-auto flex w-full gap-3'>
        <TextButton className='w-full' onClick={() => setPopup(true)}>
          {t('Stake')}
        </TextButton>
        {isLegacy ? (
          <>
            <OutlinedButton
              className='w-full'
              onClick={() => onClaimFees(pool)}
              disabled={feesInUsd.isZero() || feesPending}
            >
              {t('Claim')}
            </OutlinedButton>
            <EmphasisButton className='w-full' onClick={() => setManagePopup(true)}>
              {t('Manage')}
            </EmphasisButton>
          </>
        ) : (
          <>
            <OutlinedButton className='w-full' onClick={() => setRemovePopup(true)}>
              {t('Remove')}
            </OutlinedButton>
            <EmphasisButton className='w-full' onClick={() => setAddPopup(true)}>
              {t('Add')}
            </EmphasisButton>
          </>
        )}
      </div>
      <GaugeManageModal
        title='Stake LP'
        pair={pool}
        balance={pool.account.walletBalance}
        label='Stake'
        popup={popup}
        setPopup={setPopup}
        onGaugeManage={onGaugeStake}
        pending={stakePending}
      />
      <AddPositionModal popup={addPopup} setPopup={setAddPopup} strategy={pool} />
      <RemovePositionModal popup={removePopup} setPopup={setRemovePopup} strategy={pool} />
      <ManagePositionModal popup={managePopup} setPopup={setManagePopup} strategy={pool} />
    </Box>
  )
}
