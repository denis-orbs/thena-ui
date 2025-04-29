import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { isAddress } from 'viem'
import { useSimulateContract } from 'wagmi'

import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import { fetchStrategyInfo } from '@/components/common/AddLiquidity/ChooseStrategy'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES } from '@/constant'
import { pairAbi } from '@/constant/abi'
import { useStakeGamma } from '@/hooks/fusion/useGamma'
import { useIchiManageV3 } from '@/hooks/fusion/useIchi'
import { useGaugeStake } from '@/hooks/useGauge'
import { useClaimFees, useV1Stake } from '@/hooks/useV1Liquidity'
import { formatAmount, fromWei, getDisplayedStrategy, ZERO_VALUE } from '@/lib/utils'
import GaugeManageModal from '@/modules/Position/GaugeManageModal'
import ManagePositionModal from '@/modules/Position/ManagePositionModal'
import MigrateWarningModal from '@/modules/Position/MigrateWarningModal'
import RemovePositionModal from '@/modules/Position/RemovePositionModal'
import { useGetAutoPoolMigration } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoIcon } from '@/svgs'

import Range from './Range'

function NotStakedItem({ position }) {
  const { networkId } = useChainSettings()
  const t = useTranslations()
  const { push } = useRouter()

  const [popup, setPopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)
  const [managePopup, setManagePopup] = useState(false)
  const { onGaugeStake, pending: stakePending } = useGaugeStake()
  const { stakeIchiPool, pending: stakeIchiPending } = useIchiManageV3()
  const { stakeGamma, pending: stakeGammaPending } = useStakeGamma()
  const { onV1Stake, pending: stakeV1Pending } = useV1Stake()
  const { onClaimFees, pending: feesPending } = useClaimFees()
  const [migrateWarningPopup, setMigrateWarningPopup] = useState(false)

  const version = position?.account?.version ?? 2
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
      } else {
        onGaugeStake(position, amount, () => setPopup(false))
      }
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

  const { data: preset } = useSWR(
    strategy.address &&
      (GAMMA_TYPES.includes(strategy.title) || strategy.title === 'DefiEdge' || ICHI_TYPES.includes(strategy.title)) &&
      position && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy),
    { refreshInterval: 0 },
  )

  return (
    <div className='flex flex-col items-center justify-between gap-4 py-4 lg:flex-row lg:py-2'>
      <div className='flex w-full items-center gap-2 lg:w-[20%] lg:min-w-[195px]'>
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
        <div className='flex flex-row justify-between max-lg:w-full max-md:items-center lg:flex-col'>
          <NewTextSubHeading className='text-xl font-semibold md:text-xl'>{position.symbol}</NewTextSubHeading>
          <Paragraph className='text-xl max-lg:font-archia max-md:font-semibold lg:text-xs'>
            {getDisplayedStrategy(position.title)}
          </Paragraph>
        </div>
      </div>
      <div className='w-full  min-w-[146px] text-center lg:w-[17%]'>
        {position.type === PAIR_TYPES.LSD ? (
          <Range currentPrice={position?.lpPrice} liquidity={1} maxPrice={preset?.max} minPrice={preset?.min} />
        ) : (
          <div className='bg-full-range relative flex h-8 items-center justify-center overflow-hidden rounded-md px-2 text-base text-neutral-300 md:h-11'>
            {t('Full Range')}
          </div>
        )}
      </div>
      <div className='flex w-full gap-4 lg:w-[39%]'>
        <div className='flex w-1/3 flex-col'>
          <TextHeading>{formatAmount(position.feeApr)}%</TextHeading>
          <TextSubHeading className=''>{t('APR')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 items-center max-lg:justify-center'>
          <div className='flex flex-col'>
            <TextHeading>${formatAmount(position.account.totalUsd.minus(position.account.stakedUsd))}</TextHeading>
            <TextSubHeading className=''>{t('Value')}</TextSubHeading>
          </div>
        </div>
        <div className='flex w-1/3 flex-col'>
          <div className='flex items-center gap-1 max-lg:justify-end max-lg:text-end'>
            <TextHeading>${formatAmount(feesInUsd)}</TextHeading>
            {feesInUsd.gt(0) && (
              <>
                <InfoIcon
                  className='h-4 w-4 stroke-neutral-400 max-lg:hidden'
                  data-tooltip-id={`not-stake-${position.address}`}
                />
                <CustomTooltip id={`not-stake-${position.address}`}>
                  {reward0.gt(0) && <p>{`${formatAmount(reward0)} ${position.token0.symbol}`}</p>}
                  {reward1.gt(0) && <p>{`${formatAmount(reward1)} ${position.token1.symbol}`}</p>}
                </CustomTooltip>
              </>
            )}
          </div>
          <TextSubHeading className=''>{t('Reward')}</TextSubHeading>
        </div>
      </div>
      <div className='flex w-full justify-center gap-2 lg:w-[24%] lg:max-w-[269px]'>
        {!migrationOptions && (
          <PrimaryButton className='h-8 w-full flex-1 text-xs md:h-11 md:text-base' onClick={() => setPopup(true)}>
            {t('Stake')}
          </PrimaryButton>
        )}

        {isV1Pool ? (
          <>
            <OutlinedButton
              className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
              onClick={() => onClaimFees(position)}
              disabled={feesInUsd.isZero() || feesPending}
            >
              {t('Claim')}
            </OutlinedButton>
            <EmphasisButton
              className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
              onClick={() => setManagePopup(true)}
            >
              {t('Manage')}
            </EmphasisButton>
          </>
        ) : (
          <>
            <OutlinedButton
              className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
              onClick={() => setRemovePopup(true)}
            >
              {t('Remove')}
            </OutlinedButton>
            {version === 3 ? (
              <EmphasisButton
                className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
                onClick={() => push(`/pools/add-liquidity?step=3&poolAddress=${position.address}&back=1`)}
              >
                {t('Add')}
              </EmphasisButton>
            ) : migrationOptions && migrationOptions.length > 0 ? (
              <Link
                href={`/pools/migration?address=${position.address}`}
                className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
              >
                <PrimaryButton className='h-8 w-full text-xs md:h-11 md:text-base'>{t('Migrate')}</PrimaryButton>
              </Link>
            ) : (
              <PrimaryButton
                className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
                onClick={() => setMigrateWarningPopup(true)}
              >
                {t('Migrate')}
              </PrimaryButton>
            )}
          </>
        )}
      </div>
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
    </div>
  )
}

export default NotStakedItem
