import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { isAddress } from 'viem'
import { useSimulateContract } from 'wagmi'

import { GreenBadge, PrimaryBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, PAIR_TYPES } from '@/constant'
import { pairAbi } from '@/constant/abi'
import { useStakeGamma } from '@/hooks/fusion/useGamma'
import { useIchiManageV3 } from '@/hooks/fusion/useIchi'
import { useGuageStake } from '@/hooks/useGauge'
import { useClaimFees, useV1Stake } from '@/hooks/useV1Liquidity'
import { formatAmount, fromWei, getDisplayedStrategy, ZERO_VALUE } from '@/lib/utils'
import { useGetAutoPoolMigration } from '@/state/pools/hooks'
import { InfoIcon } from '@/svgs'

import GaugeManageModal from './GaugeManageModal'
import ManagePositionModal from './ManagePositionModal'
import MigrateWarningModal from './MigrateWarningModal'
import RemovePositionModal from './RemovePositionModal'

export default function NotStaked({ pool }) {
  const t = useTranslations()
  const { push } = useRouter()

  const [popup, setPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)
  const [managePopup, setManagePopup] = useState(false)
  const { onGaugeStake, pending: stakePending } = useGuageStake()
  const { stakeIchiPool, pending: stakeIchiPending } = useIchiManageV3()
  const { stakeGamma, pending: stakeGammaPending } = useStakeGamma()
  const { onV1Stake, pending: stakeV1Pending } = useV1Stake()
  const { onClaimFees, pending: feesPending } = useClaimFees()
  const [migrateWarningPopup, setMigrateWarningPopup] = useState(false)

  const version = pool?.account?.version ?? 2
  const migrationLink = useMemo(() => `/pools/migration?address=${pool.address}&staked=false`, [pool.address])

  const handleStake = useCallback(
    amount => {
      if (version === 3) {
        // Gamma pools
        if (GAMMA_TYPES.includes(pool.title)) {
          stakeGamma({
            position: pool,
            amount,
            callback: () => setPopup(false),
          })
        } else if ([PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(pool.type)) {
          // V1 pools
          onV1Stake(pool, amount, () => setPopup(false))
        } else {
          // Ichi pools
          stakeIchiPool({
            vaultAddress: pool.address,
            amount,
            callback: () => setPopup(false),
          })
        }
      } else {
        onGaugeStake(pool, amount, () => setPopup(false))
      }
    },
    [version, pool, stakeGamma, onV1Stake, stakeIchiPool, onGaugeStake],
  )

  const walletUsd = useMemo(() => pool.account.totalUsd.minus(pool.account.stakedUsd), [pool])
  const token0Amount = useMemo(() => pool.account.total0.minus(pool.account.staked0), [pool])
  const token1Amount = useMemo(() => pool.account.total1.minus(pool.account.staked1), [pool])
  const token0Percent = useMemo(() => {
    const token0InUsd = token0Amount.times(pool.token0.price)
    return token0InUsd.div(walletUsd).times(100).toFixed(2)
  }, [walletUsd, token0Amount, pool])

  const isV1Pool = useMemo(() => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(pool.title), [pool])

  const { data: fees } = useSimulateContract({
    abi: pairAbi,
    address: pool.address,
    functionName: 'claimFees',
    query: {
      enable: isV1Pool && isAddress(pool.address),
    },
  })

  const { feesInUsd, reward0, reward1 } = useMemo(() => {
    const _reward0 = isV1Pool ? fromWei(fees?.result?.[0] ?? 0n, pool.token0.decimals) : pool.account.token0claimable
    const _reward1 = isV1Pool ? fromWei(fees?.result?.[1] ?? 0n, pool.token1.decimals) : pool.account.token1claimable

    const fees0 = _reward0?.times(pool.token0.price) || ZERO_VALUE
    const fees1 = _reward1?.times(pool.token1.price) || ZERO_VALUE

    return {
      feesInUsd: fees0.plus(fees1),
      reward0: _reward0,
      reward1: _reward1,
    }
  }, [fees?.result, isV1Pool, pool])

  const migrationOptions = useGetAutoPoolMigration({
    token0Address: pool.token0.address,
    token1Address: pool.token1.address,
    type: pool.title,
    version: pool.account.version,
  })

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
        <div className='flex items-center gap-2'>
          {pool?.title?.includes('Farming') && <GreenBadge>Farm Strategy</GreenBadge>}
          <PrimaryBadge>{t('Not Staked')}</PrimaryBadge>
        </div>
      </div>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-sm'>APR</Paragraph>
          <TextHeading>{formatAmount(pool.feeApr)}%</TextHeading>
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

        {isV1Pool && (
          <div className='flex items-center justify-between'>
            <Paragraph className='text-sm'>{t('Claimable Amount')}</Paragraph>
            <div className='flex items-center gap-1'>
              <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
              <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`not-stake-${pool.address}`} />
              <CustomTooltip id={`not-stake-${pool.address}`}>
                {reward0.gt(0) && <p>{`${formatAmount(reward0)} ${pool.token0.symbol}`}</p>}
                {reward1.gt(0) && <p>{`${formatAmount(reward1)} ${pool.token1.symbol}`}</p>}
              </CustomTooltip>
            </div>
          </div>
        )}
      </div>
      <div className='mt-auto flex w-full gap-3'>
        {!migrationOptions && (
          <PrimaryButton className='w-full' onClick={() => setPopup(true)}>
            {t('Stake')}
          </PrimaryButton>
        )}

        {isV1Pool ? (
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
            {version === 3 ? (
              <EmphasisButton
                className='w-full'
                onClick={() => push(`/pools/add-liquidity?step=3&poolAddress=${pool.address}`)}
              >
                {t('Add')}
              </EmphasisButton>
            ) : migrationOptions && migrationOptions.length > 0 ? (
              <Link href={`/pools/migration?address=${pool.address}`} className='w-full'>
                <PrimaryButton className='w-full'>{t('Migrate')}</PrimaryButton>
              </Link>
            ) : (
              <PrimaryButton className='w-full' onClick={() => setMigrateWarningPopup(true)}>
                {t('Migrate')}
              </PrimaryButton>
            )}
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
        title='Stake LP'
        pair={pool}
        balance={pool.account.walletBalance}
        label='Stake'
        popup={popup}
        setPopup={setPopup}
        onGaugeManage={handleStake}
        pending={stakePending || stakeIchiPending || stakeV1Pending || stakeGammaPending}
      />
      <RemovePositionModal popup={removePopup} setPopup={setRemovePopup} strategy={pool} />
      <ManagePositionModal popup={managePopup} setPopup={setManagePopup} strategy={pool} />
    </Box>
  )
}
