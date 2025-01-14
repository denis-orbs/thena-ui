import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { GreenBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES } from '@/constant'
import { useGammaClaim, useGammaData } from '@/hooks/fusion/useGamma'
import { useGaugeHarvest, useGuageUnstake } from '@/hooks/useGauge'
import { cn, formatAmount, getLiquidityRangeType } from '@/lib/utils'
import { updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { InfoIcon } from '@/svgs'

import AddPositionModal from './AddPositionModal'
import GaugeManageModal from './GaugeManageModal'
import RemovePositionModal from './RemovePositionModal'

export default function Staked({ pool }) {
  const [removePopup, setRemovePopup] = useState(false)
  const [popup, setPopup] = useState(false)
  const [addPopup, setAddPopup] = useState(false)
  const { onGaugeUnstake, pending: unstakePending } = useGuageUnstake()
  const { onGammaClaim, pending: claimPending } = useGammaClaim()
  const { onGaugeHarvest, pending } = useGaugeHarvest()

  const {
    rewardsData: { totalUsd, rewards },
  } = useGammaData(pool)

  const dispatch = useDispatch()
  const t = useTranslations()

  const version = pool?.account?.version ?? 2
  const token0Percent = useMemo(() => {
    const token0InUsd = pool.account.staked0.times(pool.token0.price)
    return token0InUsd.div(pool.account.stakedUsd).times(100).toFixed(2)
  }, [pool])

  const handleUnstake = amount => {
    onGaugeUnstake(pool, amount, () => {
      setPopup(false)
    })
  }

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
          <Paragraph className='text-sm'>{t('Claimable Amount')}</Paragraph>
          <div className='flex items-center gap-1'>
            <TextHeading>
              ${formatAmount(GAMMA_TYPES.includes(pool.type) ? totalUsd : pool.account.earnedUsd)}
            </TextHeading>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`stake-${pool.address}`} />

            <CustomTooltip id={`stake-${pool.address}`}>
              <div className={cn(GAMMA_TYPES.includes(pool.type) && 'hidden')}>
                {pool.account.gaugeEarned && <p>{`${formatAmount(pool.account.gaugeEarned)} THE`}</p>}
                {pool.account.earned0 && <p>{`${formatAmount(pool.account.earned0)} ${pool.token0.symbol}`}</p>}
                {pool.account.earned1 && <p>{`${formatAmount(pool.account.earned1)} ${pool.token1.symbol}`}</p>}
                {pool.account.earned2 && <p>{`${formatAmount(pool.account.earned2)} ${pool.reward.symbol}`}</p>}
                {pool.account.extraRewards && (
                  <p>{`${formatAmount(pool.account.extraRewards.amount)} ${pool.account.extraRewards.symbol}`}</p>
                )}
              </div>

              <div className={cn(!GAMMA_TYPES.includes(pool.type) && 'hidden')}>
                {(rewards || []).map(item => (
                  <p>{`${formatAmount(item.amount)} ${item.asset.symbol}`}</p>
                ))}
              </div>
            </CustomTooltip>
          </div>
        </div>
      </div>
      <div className='mt-auto flex w-full gap-3'>
        <TextButton className={cn('w-full', version === 3 && 'hidden')} onClick={() => setPopup(true)}>
          {t('Unstake')}
        </TextButton>

        <OutlinedButton className={cn('w-full', version === 2 && 'hidden')} onClick={() => setRemovePopup(true)}>
          {t('Remove')}
        </OutlinedButton>

        <OutlinedButton
          className='w-full'
          onClick={() => {
            if (version === 2) onGaugeHarvest(pool)
            else onGammaClaim(pool)
          }}
          disabled={pending || claimPending || pool.account.earnedUsd.isZero()}
        >
          {t('Harvest')}
        </OutlinedButton>

        <EmphasisButton
          className={cn('w-full', version === 2 && 'hidden')}
          onClick={() => {
            dispatch(updateLiquidityRangeType({ liquidityRangeType: getLiquidityRangeType(pool.title) }))
            dispatch(
              updateStrategy({
                strategy: {
                  // ...pool,
                  title: pool?.title,
                  token0: {
                    ...pool?.token0,
                    reserve: pool?.token0?.reserve?.toNumber(),
                    balance: pool?.token0?.balance?.toNumber(),
                    totalValue: pool?.token0?.totalValue?.toNumber(),
                  },
                  token1: {
                    ...pool?.token1,
                    reserve: pool?.token1?.reserve?.toNumber(),
                    balance: pool?.token1?.balance?.toNumber(),
                    totalValue: pool?.token1?.totalValue?.toNumber(),
                  },
                  isAutomatic: true,
                  isFarming: true, // TODO: REMOVE HARD CODE
                  version,
                },
              }),
            )
            setAddPopup(true)
          }}
        >
          {t('Add')}
        </EmphasisButton>

        <Link href={`/pools/migration?address=${pool.address}`} className={cn('w-full', version === 3 && 'hidden')}>
          <PrimaryButton className='w-full'>{t('Migrate')}</PrimaryButton>
        </Link>
      </div>

      <GaugeManageModal
        title='Unstake LP'
        pair={pool}
        balance={pool.account.gaugeBalance}
        label='Unstake'
        popup={popup}
        setPopup={setPopup}
        onGaugeManage={handleUnstake}
        pending={unstakePending}
      />

      <RemovePositionModal popup={removePopup} setPopup={setRemovePopup} strategy={pool} />

      <AddPositionModal popup={addPopup} setPopup={setAddPopup} strategy={pool} />
    </Box>
  )
}
