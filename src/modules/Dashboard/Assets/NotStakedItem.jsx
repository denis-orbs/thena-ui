import BigNumber from 'bignumber.js'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { isAddress } from 'viem'
import { useSimulateContract } from 'wagmi'

import { EmphasisButton, ErrorButton, PrimaryButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES } from '@/constant'
import { pairAbi } from '@/constant/abi'
import { ICHI_VAULTS } from '@/constant/ichiVaults'
import { useStakeGamma } from '@/hooks/fusion/useGamma'
import { useIchiManageV3 } from '@/hooks/fusion/useIchi'
import { useAutomaticRange } from '@/hooks/position/useAutomaticRange'
import { useGaugeStake } from '@/hooks/useGauge'
import { useClaimFees, useV1Stake } from '@/hooks/useV1Liquidity'
import {
  cn,
  formatAmount,
  fromWei,
  getDisplayedStrategy,
  getLiquidityRangeType,
  isInvalidAmount,
  ZERO_VALUE,
} from '@/lib/utils'
import GaugeManageModal from '@/modules/Position/GaugeManageModal'
import MigrateWarningModal from '@/modules/Position/MigrateWarningModal'
import { updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { useGetAutoPoolMigration } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoIcon, WarningTriangleIcon } from '@/svgs'

import APR from './APR'
import Range from './Range'

function NotStakedItem({ position, isXlDown }) {
  const dispatch = useDispatch()
  const t = useTranslations()
  const { push } = useRouter()

  const [popup, setPopup] = useState(false)
  // const [removePopup, setRemovePopup] = useState(false)
  // const [managePopup, setManagePopup] = useState(false)
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

  const getDisplayName = useCallback(token => (token.name === 'Wrapped BNB' ? 'WBNB' : token.symbol || 'UNKNOWN'), [])

  const renderTokenValue = useMemo(() => {
    const token0Value = BigNumber(position.account.total0).minus(position.account.staked0)
    const token1Value = BigNumber(position.account.total1).minus(position.account.staked1)

    const hasInvalidAmounts = isInvalidAmount(token0Value) && isInvalidAmount(token1Value)
    if (hasInvalidAmounts) return null

    return (
      <>
        {!isInvalidAmount(token0Value) && <p>{`${formatAmount(token0Value)} ${getDisplayName(position.token0)}`}</p>}
        {!isInvalidAmount(token1Value) && <p>{`${formatAmount(token1Value)} ${getDisplayName(position.token1)}`}</p>}
      </>
    )
  }, [
    getDisplayName,
    position.account.staked0,
    position.account.staked1,
    position.account.total0,
    position.account.total1,
    position.token0,
    position.token1,
  ])

  const handleAdd = useCallback(() => {
    dispatch(updateStrategy({ strategy }))
    dispatch(updateLiquidityRangeType({ liquidityRangeType: getLiquidityRangeType(position.title) }))
    push(
      // eslint-disable-next-line max-len
      `/pools/add-liquidity?step=3&poolAddress=${position.basePool}&staked=false&title=${position.title}&back=2&version=${version}`,
    )
  }, [dispatch, position.basePool, position.title, push, strategy, version])

  const pairCell = useMemo(
    () => (
      <div className='flex w-full items-center gap-2'>
        <GroupIconTokens
          classNames={{
            image: 'outline-2 w-7 h-7',
            rows: '*:not-first:-ml-2',
            toolTip: 'hidden',
          }}
          width={32}
          height={32}
          tokens={[position.token0, position.token1]}
        />
        <div className='flex justify-between max-xl:w-full max-xl:items-center xl:flex-col'>
          {position.version === 2 && position.title !== 'ICHI_Single_Sided' ? (
            <NewTextSubHeading className='text-xl font-semibold md:text-xl'>{position.symbol}</NewTextSubHeading>
          ) : (
            <Link href={`/analytics/pairs/${position.basePool}?back=2`}>
              <NewTextSubHeading className='text-xl font-semibold md:text-xl'>{position.symbol}</NewTextSubHeading>
            </Link>
          )}
          <Paragraph className='text-lg font-medium text-neutral-500 md:text-lg xl:text-xs xl:text-neutral-300'>
            {getDisplayedStrategy(position.title, position.version, true)}
          </Paragraph>
        </div>
      </div>
    ),
    [position.token0, position.token1, position.symbol, position.title, position.version, position.basePool],
  )

  const rangeCell = useMemo(
    () => (
      <div className='w-full text-center'>
        {position.type === PAIR_TYPES.LSD ? (
          isSingleSided ? (
            <>
              {position.staked ? (
                <div className='flex h-15 w-full items-center'>
                  <div
                    className={cn(
                      'relative flex h-5 w-full items-center justify-center overflow-hidden',
                      'bg-full-range rounded-md border border-neutral-600 px-2 text-xs leading-4 text-neutral-500',
                    )}
                  >
                    {t('$THE Single Sided Vault')}
                  </div>
                </div>
              ) : (
                <div className='flex h-12! w-full'>
                  <div
                    className={cn(
                      'relative flex h-12 w-full items-center justify-between overflow-hidden',
                      'bg-error-950 border-error-800 rounded-md border px-2 text-xs leading-4 text-neutral-500',
                    )}
                  >
                    <div className='flex items-center gap-2 text-xs'>
                      <WarningTriangleIcon className='stroke-error-600 h-4 w-4' />
                      <span className='text-error-100'>{t('This is Idle')}</span>
                    </div>
                    <ErrorButton
                      className={cn('h-8 w-[77px]! rounded-md text-xs leading-4 text-nowrap', {
                        // hidden: hideButton.earn,
                      })}
                      onClick={() => handleStake(position?.account?.walletBalance.dp(18).toString(10))}
                    >
                      {t('Earn $THE')}
                    </ErrorButton>
                  </div>
                </div>
              )}
            </>
          ) : position.title.includes('ICHI') || GAMMA_TYPES.includes(position.title) ? (
            position.staked || (version === 2 && !isSingleSided) ? (
              <div className='flex h-15 w-full items-center'>
                <div
                  className={cn(
                    'relative flex h-5 w-full items-center justify-center overflow-hidden',
                    'bg-full-range rounded-md border border-neutral-600 px-2 text-xs leading-4 text-neutral-500',
                  )}
                >
                  {t('Automated')}
                </div>
              </div>
            ) : (
              <div className='flex h-12! w-full'>
                <div
                  className={cn(
                    'relative flex h-12 w-full items-center justify-between overflow-hidden',
                    'bg-error-950 border-error-800 rounded-md border px-2 text-xs leading-4 text-neutral-500',
                  )}
                >
                  <div className='flex items-center gap-2 text-xs'>
                    <WarningTriangleIcon className='stroke-error-600 h-4 w-4' />
                    <span className='text-error-100'>{t('This is Idle')}</span>
                  </div>
                  <ErrorButton
                    className={cn('h-8 w-[77px]! rounded-md text-xs leading-4 text-nowrap', {
                      // hidden: hideButton.earn,
                    })}
                    onClick={() => handleStake(position?.account?.walletBalance.dp(18).toString(10))}
                  >
                    {t('Earn $THE')}
                  </ErrorButton>
                </div>
              </div>
            )
          ) : (
            <Range currentPrice={currentPrice} liquidity={1} maxPrice={priceUpper} minPrice={priceLower} />
          )
        ) : (
          <div className='flex h-15 w-full items-center'>
            <div
              className={cn(
                'relative flex h-5 w-full items-center justify-center overflow-hidden',
                'bg-full-range rounded-md border border-neutral-600 px-2 text-xs leading-4 text-neutral-500',
              )}
            >
              {t('Full Range')}
            </div>
          </div>
        )}
      </div>
    ),
    [
      position.type,
      position.staked,
      position.title,
      position?.account?.walletBalance,
      isSingleSided,
      t,
      version,
      currentPrice,
      priceUpper,
      priceLower,
      handleStake,
    ],
  )

  const aprCell = useMemo(
    () => (
      <APR
        currentPrice={currentPrice}
        minPrice={priceLower}
        maxPrice={priceUpper}
        positionType={position.type}
        apr={position.apr}
      />
    ),
    [currentPrice, priceLower, priceUpper, position.type, position.apr],
  )

  const valueCell = useMemo(
    () => (
      <div className='flex items-center max-xl:flex-1 max-xl:justify-center'>
        <div className='flex flex-col'>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(position.account.totalUsd.minus(position.account.stakedUsd))}</TextHeading>
            {renderTokenValue && (
              <>
                <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`value-${position.positionId}`} />
                <CustomTooltip id={`value-${position.positionId}`}>{renderTokenValue}</CustomTooltip>
              </>
            )}
          </div>

          <TextSubHeading className='font-medium xl:text-base'>{t('Value')}</TextSubHeading>
        </div>
      </div>
    ),
    [position.account.stakedUsd, position.account.totalUsd, position.positionId, renderTokenValue, t],
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
        <TextSubHeading className='font-medium max-xl:text-end xl:text-base'>{t('Reward')}</TextSubHeading>
      </div>
    ),
    [feesInUsd, position.address, position.token0.symbol, position.token1.symbol, reward0, reward1, t],
  )

  const actionCell = useMemo(
    () => (
      <div
        className={cn(
          'flex w-full grid-cols-2 justify-center gap-2',
          !(version === 3 && isSingleSided) && 'grid-cols-1',
        )}
      >
        {isV1Pool ? (
          <>
            <EmphasisButton
              className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
              onClick={() => onClaimFees(position)}
              disabled={feesInUsd.isZero() || feesPending}
            >
              {t('Claim')}
            </EmphasisButton>
            <EmphasisButton className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')} onClick={handleAdd}>
              {t('Manage')}
            </EmphasisButton>
          </>
        ) : (
          <>
            {/* <EmphasisButton
              className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
              onClick={() => setRemovePopup(true)}
            >
              {t('Remove')}
            </EmphasisButton> */}

            {version === 3 || isSingleSided ? (
              <>
                <EmphasisButton
                  className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
                  onClick={() => onClaimFees(position)}
                  disabled={feesInUsd.isZero() || feesPending}
                >
                  {t('Claim')}
                </EmphasisButton>
                <EmphasisButton className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')} onClick={handleAdd}>
                  {t('Manage')}
                </EmphasisButton>
              </>
            ) : migrationOptions?.length > 0 ? (
              <Link
                href={`/pools/migration?address=${position.address}&staked=false`}
                className={cn('h-8 w-full px-1 md:h-11')}
              >
                <PrimaryButton className='h-8 w-full text-xs md:h-11 md:text-base'>{t('Migrate')}</PrimaryButton>
              </Link>
            ) : (
              <PrimaryButton
                className={cn('h-8 w-full flex-1 px-1 text-xs md:h-11 md:text-base')}
                onClick={() => setMigrateWarningPopup(true)}
              >
                {t('Migrate')}
              </PrimaryButton>
            )}
          </>
        )}
      </div>
    ),
    [feesInUsd, feesPending, handleAdd, isSingleSided, isV1Pool, migrationOptions, onClaimFees, position, t, version],
  )

  return (
    <>
      {!isXlDown ? (
        <>
          <td className='rounded-l-md pl-4!'>{pairCell}</td>
          <td>{rangeCell}</td>
          <td>{aprCell}</td>
          <td>{valueCell}</td>
          <td>{rewardsCell}</td>
          <td className='rounded-r-md pr-4!'>{actionCell}</td>
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
      {/* <RemovePositionModal isStaked={false} popup={removePopup} setPopup={setRemovePopup} strategy={position} /> */}
      {/* <ManagePositionModal popup={managePopup} setPopup={setManagePopup} strategy={position} /> */}
    </>
  )
}

export default NotStakedItem
