import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { isAddress } from 'viem'
import { useSimulateContract } from 'wagmi'

import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewParagraph, NewTextSubHeading, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES } from '@/constant'
import { pairAbi } from '@/constant/abi'
import { ICHI_VAULTS } from '@/constant/ichiVaults'
import { useStakeGamma } from '@/hooks/fusion/useGamma'
import { useIchiManageV3 } from '@/hooks/fusion/useIchi'
import { useAutomaticRange } from '@/hooks/position/useAutomaticRange'
import { useGaugeStake } from '@/hooks/useGauge'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useClaimFees, useV1Stake } from '@/hooks/useV1Liquidity'
import { cn, formatAmount, fromWei, getDisplayedStrategy, ZERO_VALUE } from '@/lib/utils'
import GaugeManageModal from '@/modules/Position/GaugeManageModal'
import ManagePositionModal from '@/modules/Position/ManagePositionModal'
import MigrateWarningModal from '@/modules/Position/MigrateWarningModal'
import RemovePositionModal from '@/modules/Position/RemovePositionModal'
import { useGetAutoPoolMigration } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoIcon } from '@/svgs'

import Range from './Range'

function NotStakedItem({ position }) {
  const t = useTranslations()
  const { push } = useRouter()
  const { isXlDown } = useMediaQuery()

  const [popup, setPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)
  const [managePopup, setManagePopup] = useState(false)
  const [migrateWarningPopup, setMigrateWarningPopup] = useState(false)

  const { networkId } = useChainSettings()
  const { onGaugeStake, pending: stakePending } = useGaugeStake()
  const { stakeIchiPool, pending: stakeIchiPending } = useIchiManageV3()
  const { stakeGamma, pending: stakeGammaPending } = useStakeGamma()
  const { onV1Stake, pending: stakeV1Pending } = useV1Stake()
  const { onClaimFees, pending: feesPending } = useClaimFees()

  const version = useMemo(() => position?.account?.version ?? 2, [position])
  const migrationLink = useMemo(() => `/pools/migration?address=${position.address}&staked=false`, [position.address])

  const handleStake = useCallback(
    amount => {
      if (version === 3) {
        // Gamma pools
        if (GAMMA_TYPES.includes(position.title)) {
          stakeGamma({
            position,
            amount,
            callback: () => setPopup(false),
          })
        } else if ([PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(position.type)) {
          // V1 pools
          onV1Stake(position, amount, () => setPopup(false))
        } else {
          // Ichi pools
          stakeIchiPool({
            vaultAddress: position.address,
            amount,
            callback: () => setPopup(false),
          })
        }
        return
      }

      onGaugeStake(position, amount, () => setPopup(false))
    },
    [version, position, stakeGamma, onV1Stake, stakeIchiPool, onGaugeStake],
  )

  const isV1Pool = useMemo(() => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(position.title), [position.title])

  const { data: fees } = useSimulateContract({
    abi: pairAbi,
    address: position.address,
    functionName: 'claimFees',
    query: {
      enable: isV1Pool && isAddress(position.address),
    },
  })

  const { feesInUsd, reward0, reward1 } = useMemo(() => {
    const _reward0 = isV1Pool
      ? fromWei(fees?.result?.[0] ?? 0n, position.token0.decimals)
      : position.account.token0claimable
    const _reward1 = isV1Pool
      ? fromWei(fees?.result?.[1] ?? 0n, position.token1.decimals)
      : position.account.token1claimable

    const fees0 = _reward0?.times(position.token0.price) || ZERO_VALUE
    const fees1 = _reward1?.times(position.token1.price) || ZERO_VALUE

    return {
      feesInUsd: fees0.plus(fees1),
      reward0: _reward0,
      reward1: _reward1,
    }
  }, [
    fees?.result,
    isV1Pool,
    position.account.token0claimable,
    position.account.token1claimable,
    position.token0.decimals,
    position.token0.price,
    position.token1.decimals,
    position.token1.price,
  ])
  const isSingleSided = useMemo(
    () => ICHI_VAULTS[networkId].some(v => v.address === position.address),
    [position.address, networkId],
  )

  const migrationOptions = useGetAutoPoolMigration({
    token0Address: position.token0.address,
    token1Address: position.token1.address,
    type: position.title,
    version: position.account.version,
  })

  const strategy = useMemo(
    () => ({
      title: position?.title,
      tvl: position?.tvl?.toNumber() ?? 0,
      apr: position?.gauge?.apr?.toNumber() ?? 0, // TODO recheck apr value
      account: {
        totalLp: position?.account?.totalLp?.toNumber(),
        gaugeBalance: position?.account?.gaugeBalance?.toNumber(),
      },
      allowed: position?.allowed,
      token0: {
        ...position?.token0,
        reserve: position?.token0?.reserve?.toNumber(),
        balance: position?.token0?.balance?.toNumber(),
        totalValue: position?.token0?.totalValue,
      },
      token1: {
        ...position?.token1,
        reserve: position?.token1?.reserve?.toNumber(),
        balance: position?.token1?.balance?.toNumber(),
        totalValue: position?.token1?.totalValue,
      },
      address: position?.address,
      isFarming: position?.title?.includes('Farming'),
      isAutomatic: !MANUAL_TYPES.includes(position?.title) && position?.type === PAIR_TYPES.LSD,
      isDefault: true,
      version,
      fee: position?.fee,
    }),
    [
      position?.account?.gaugeBalance,
      position?.account?.totalLp,
      position?.address,
      position?.allowed,
      position?.fee,
      position?.gauge?.apr,
      position?.title,
      position?.token0,
      position?.token1,
      position?.tvl,
      position?.type,
      version,
    ],
  )

  const [priceLower, priceUpper, currentPrice] = useAutomaticRange(position, strategy, networkId)

  const pairCell = useMemo(
    () => (
      <div className='flex w-full items-center gap-2'>
        <GroupIconTokens
          classNames={{
            image: 'outline-2 w-7 h-7',
            rows: '-space-x-2',
            toolTip: 'hidden',
          }}
          width={32}
          height={32}
          tokens={[position.token0, position.token1]}
        />
        <div className='flex justify-between max-xl:w-full max-xl:items-center xl:flex-col'>
          <NewTextSubHeading className='text-xl font-semibold md:text-xl'>{position.symbol}</NewTextSubHeading>
          <NewParagraph className='text-xl text-neutral-500 md:text-xl xl:text-xs xl:text-neutral-300'>
            {getDisplayedStrategy(position.title)}
          </NewParagraph>
        </div>
      </div>
    ),
    [position.token0, position.token1, position.symbol, position.title],
  )

  const rangeCell = useMemo(
    () => (
      <div className='w-full text-center'>
        {position.type === PAIR_TYPES.LSD ? (
          <Range currentPrice={currentPrice} liquidity={1} maxPrice={priceUpper} minPrice={priceLower} />
        ) : (
          <div className='bg-full-range relative flex h-8 items-center justify-center overflow-hidden rounded-md px-2 text-base text-neutral-300 md:h-11'>
            {t('Full Range')}
          </div>
        )}
      </div>
    ),
    [position.type, priceLower, priceUpper, currentPrice, t],
  )

  const aprCell = useMemo(
    () => (
      <div className='flex flex-col max-xl:flex-1'>
        <TextHeading>{formatAmount(position.apr)}%</TextHeading>
        <TextSubHeading className=''>{t('APR')}</TextSubHeading>
      </div>
    ),
    [position.apr, t],
  )

  const valueCell = useMemo(
    () => (
      <div className='flex items-center max-xl:flex-1 max-xl:justify-center'>
        <div className='flex flex-col'>
          <TextHeading>${formatAmount(position.account.totalUsd.minus(position.account.stakedUsd))}</TextHeading>
          <TextSubHeading className=''>{t('Value')}</TextSubHeading>
        </div>
      </div>
    ),
    [position.account.stakedUsd, position.account.totalUsd, t],
  )

  const rewardsCell = useMemo(
    () => (
      <div className='flex flex-col max-xl:flex-1'>
        <div className='flex items-center gap-1 max-xl:justify-end max-xl:text-end'>
          <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
          {feesInUsd.gt(0) && (
            <>
              <InfoIcon
                className='h-4 w-4 stroke-neutral-400 max-xl:hidden'
                data-tooltip-id={`not-stake-${position.address}`}
              />
              <CustomTooltip id={`not-stake-${position.address}`}>
                {reward0.gt(0) && <p>{`${formatAmount(reward0)} ${position.token0.symbol}`}</p>}
                {reward1.gt(0) && <p>{`${formatAmount(reward1)} ${position.token1.symbol}`}</p>}
              </CustomTooltip>
            </>
          )}
        </div>
        <TextSubHeading className='max-xl:text-end'>{t('Reward')}</TextSubHeading>
      </div>
    ),
    [feesInUsd, position.address, position.token0.symbol, position.token1.symbol, reward0, reward1, t],
  )

  const actionCell = useMemo(
    () => (
      <div
        className={cn('flex w-full justify-center gap-2', {
          'grid-cols-2': !!migrationOptions && !isSingleSided,
          'grid-cols-3': !migrationOptions && isSingleSided,
        })}
      >
        {(!migrationOptions || isSingleSided) && (
          <PrimaryButton className='h-8 flex-1 px-1 text-xs md:h-11 md:text-base' onClick={() => setPopup(true)}>
            {t('Stake')}
          </PrimaryButton>
        )}

        {isV1Pool ? (
          <>
            <OutlinedButton
              className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
              onClick={() => onClaimFees(position)}
              disabled={feesInUsd.isZero() || feesPending}
            >
              {t('Claim')}
            </OutlinedButton>
            <EmphasisButton
              className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
              onClick={() => setManagePopup(true)}
            >
              {t('Manage')}
            </EmphasisButton>
          </>
        ) : (
          <>
            <OutlinedButton
              className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
              onClick={() => setRemovePopup(true)}
            >
              {t('Remove')}
            </OutlinedButton>

            {version === 3 || isSingleSided ? (
              <EmphasisButton
                className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
                onClick={() => push(`/pools/add-liquidity?step=3&poolAddress=${position.basePool}&back=1`)}
              >
                {t('Add')}
              </EmphasisButton>
            ) : migrationOptions?.length > 0 ? (
              <Link href={`/pools/migration?address=${position.address}`} className={cn('h-8 px-1 md:h-11')}>
                <PrimaryButton className='h-8 w-full text-xs md:h-11 md:text-base'>{t('Migrate')}</PrimaryButton>
              </Link>
            ) : (
              <PrimaryButton
                className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
                onClick={() => setMigrateWarningPopup(true)}
              >
                {t('Migrate')}
              </PrimaryButton>
            )}
          </>
        )}
      </div>
    ),
    [feesInUsd, feesPending, isSingleSided, isV1Pool, migrationOptions, onClaimFees, position, push, t, version],
  )

  return (
    <>
      {!isXlDown ? (
        <>
          <td>{pairCell}</td>
          <td>{rangeCell}</td>
          <td>{aprCell}</td>
          <td>{valueCell}</td>
          <td>{rewardsCell}</td>
          <td>{actionCell}</td>
        </>
      ) : (
        <div className='flex flex-col gap-4 py-4'>
          {pairCell}
          {rangeCell}
          <div className='flex w-full gap-2'>
            {aprCell}
            {valueCell}
            {rewardsCell}
          </div>
          {actionCell}
        </div>
      )}

      <MigrateWarningModal
        popup={migrateWarningPopup}
        setPopup={setMigrateWarningPopup}
        strategy={position.type === PAIR_TYPES.LSD ? (ICHI_TYPES.includes(position.title) ? 'ICHI' : 'Gamma') : 'V1'}
        link={migrationLink}
        handleWithdrawV1={() => {
          setMigrateWarningPopup(false)
          setPopup(true)
        }}
      />
      <GaugeManageModal
        title='Stake LP'
        pair={position}
        balance={position.account.walletBalance}
        label='Stake'
        popup={popup}
        setPopup={setPopup}
        onGaugeManage={handleStake}
        pending={stakePending || stakeIchiPending || stakeV1Pending || stakeGammaPending}
      />
      <RemovePositionModal popup={removePopup} setPopup={setRemovePopup} strategy={position} />
      <ManagePositionModal popup={managePopup} setPopup={setManagePopup} strategy={position} />
    </>
  )
}

export default NotStakedItem
