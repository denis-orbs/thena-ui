import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { GreenBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, PAIR_TYPES } from '@/constant'
import { useGammaClaim, useGetGammaReward } from '@/hooks/fusion/useGamma'
import { useGaugeHarvest, useGuageUnstake } from '@/hooks/useGauge'
import { cn, formatAmount, getDisplayedStrategy, getLiquidityRangeType } from '@/lib/utils'
import { updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { useGetAutoPoolMigration } from '@/state/pools/hooks'
import { InfoIcon } from '@/svgs'

import AddPositionModal from './AddPositionModal'
import GaugeManageModal from './GaugeManageModal'
import MigrateWarningModal from './MigrateWarningModal'
import RemovePositionModal from './RemovePositionModal'

export default function Staked({ pool }) {
  const [removePopup, setRemovePopup] = useState(false)
  const [popup, setPopup] = useState(false)
  const [addPopup, setAddPopup] = useState(false)
  const [migrateWarningPopup, setMigrateWarningPopup] = useState(false)

  const { rewardsData } = useGetGammaReward(pool)
  const { onGaugeUnstake, pending: unstakePending } = useGuageUnstake()
  const { onGammaClaim, pending: claimPending } = useGammaClaim()
  const { onGaugeHarvest } = useGaugeHarvest()

  const migrationOptions = useGetAutoPoolMigration({
    token0Address: pool.token0.address,
    token1Address: pool.token1.address,
    type: pool.title,
    version: pool.account.version,
  })
  const isSwapFee = pool?.title.includes('SwapFee')
  const migrationLink = `/pools/migration?address=${pool.address}&staked=true`

  const dispatch = useDispatch()
  const t = useTranslations()

  const version = pool?.account?.version ?? 2
  const depositValueUSD = useMemo(
    () => (isSwapFee ? pool?.account.totalUsd : pool.account.stakedUsd),
    [isSwapFee, pool.account.stakedUsd, pool.account.totalUsd],
  )

  const token0Percent = useMemo(() => {
    const token0InUsd = pool.account.staked0.times(pool.token0.price)
    return token0InUsd.div(depositValueUSD).times(100).toFixed(2)
  }, [depositValueUSD, pool.account.staked0, pool.token0.price])

  const handleUnstake = useCallback(
    amount => {
      onGaugeUnstake(pool, amount, () => {
        setPopup(false)
      })
    },
    [onGaugeUnstake, pool],
  )

  const handleHavest = useCallback(() => {
    if (GAMMA_TYPES.includes(pool.title)) {
      onGammaClaim(pool)
    } else if (ICHI_TYPES.includes(pool.title)) {
      // TODO: ICHI claim
    } else {
      onGaugeHarvest(pool)
    }
  }, [onGammaClaim, onGaugeHarvest, pool])

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
            <Paragraph className='text-xs'>{getDisplayedStrategy(pool.title)}</Paragraph>
          </div>
        </div>
        <GreenBadge>
          {pool?.title?.includes('_Farming')
            ? 'Farm Strategy'
            : pool?.title?.includes('_SwapFee')
              ? 'Fee Strategy'
              : t('Staked')}
        </GreenBadge>
      </div>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('APR')}</Paragraph>
          <TextHeading>{formatAmount(pool.gauge.apr)}%</TextHeading>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>{t('Deposit Value in USD')}</Paragraph>
          <TextHeading>${formatAmount(depositValueUSD)}</TextHeading>
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
          {isSwapFee ? (
            <div className='flex items-center gap-1'>
              <TextHeading>Auto Compound</TextHeading>
              <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id='AUTO_COMPOUND' />
              <CustomTooltip className='max-w-[320px]' id='AUTO_COMPOUND'>
                Your rewards are automatically compounded back into your liquidity. Please check with Gamma or ICHI for
                the details of their strategies.
              </CustomTooltip>
            </div>
          ) : (
            <div className='flex items-center gap-1'>
              <TextHeading>
                ${formatAmount(GAMMA_TYPES.includes(pool.title) ? rewardsData?.totalUsd : pool.account.earnedUsd)}
              </TextHeading>
              <InfoIcon
                className='h-4 w-4 stroke-neutral-400'
                data-tooltip-id={`stake-${pool.address}-${pool.account.earnedUsd}`}
              />

              <CustomTooltip id={`stake-${pool.address}-${pool.account.earnedUsd}`}>
                <div className={cn(GAMMA_TYPES.includes(pool.title) && 'hidden')}>
                  {pool.account.gaugeEarned && <p>{`${formatAmount(pool.account.gaugeEarned)} THE`}</p>}
                  {pool.account.earned0 && <p>{`${formatAmount(pool.account.earned0)} ${pool.token0.symbol}`}</p>}
                  {pool.account.earned1 && <p>{`${formatAmount(pool.account.earned1)} ${pool.token1.symbol}`}</p>}
                  {pool.account.earned2 && <p>{`${formatAmount(pool.account.earned2)} ${pool.reward.symbol}`}</p>}
                </div>

                <div className={cn(!GAMMA_TYPES.includes(pool.title) && 'hidden')}>
                  {(rewardsData.rewards || []).map(item => (
                    <p key={item.asset.symbol}>{`${formatAmount(item.amount)} ${item.asset.symbol}`}</p>
                  ))}
                </div>
              </CustomTooltip>
            </div>
          )}
        </div>
      </div>

      <div className='mt-auto flex w-full gap-3'>
        {version === 2 ? (
          // Version 2 actions
          <>
            <TextButton className='w-full' onClick={() => setPopup(true)}>
              {t('Unstake')}
            </TextButton>

            {migrationOptions && migrationOptions.length > 0 ? (
              <Link href={migrationLink} className='w-full'>
                <PrimaryButton className='w-full'>{t('Migrate')}</PrimaryButton>
              </Link>
            ) : (
              <PrimaryButton className='w-full' onClick={() => setMigrateWarningPopup(true)}>
                {t('Migrate')}
              </PrimaryButton>
            )}
          </>
        ) : (
          // Version 3 actions
          <>
            {pool.type === PAIR_TYPES.LSD ? (
              <OutlinedButton className='w-full' onClick={() => setRemovePopup(true)}>
                {t('Remove')}
              </OutlinedButton>
            ) : (
              <TextButton className='w-full' onClick={() => setPopup(true)}>
                {t('Unstake')}
              </TextButton>
            )}

            <OutlinedButton
              className={cn('w-full', isSwapFee && 'hidden')}
              onClick={handleHavest}
              disabled={claimPending || pool.account.earnedUsd.isZero()}
            >
              {t('Harvest')}
            </OutlinedButton>

            <EmphasisButton
              className={cn('w-full')}
              onClick={() => {
                dispatch(updateLiquidityRangeType({ liquidityRangeType: getLiquidityRangeType(pool.title) }))
                dispatch(
                  updateStrategy({
                    strategy: {
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
                      tvl: pool?.tvl?.toNumber(),
                      isAutomatic: true,
                      isFarming: pool.title.includes('Farming'),
                      version,
                    },
                  }),
                )
                setAddPopup(true)
              }}
            >
              {t('Add')}
            </EmphasisButton>
          </>
        )}
      </div>

      <MigrateWarningModal
        popup={migrateWarningPopup}
        setPopup={setMigrateWarningPopup}
        strategy={pool.type === PAIR_TYPES.LSD ? (ICHI_TYPES.includes(pool.title) ? 'ICHI' : 'Gamma') : 'V1'}
        link={migrationLink}
        handleWithdrawV1={() => {
          setMigrateWarningPopup(false)
          setPopup(true)
        }}
      />

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
