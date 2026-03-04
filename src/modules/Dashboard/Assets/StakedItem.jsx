import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { useGaugeAlive } from '@/app/pools/(add-liquidity)/add-liquidity/ClPool'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES, STRATEGY_TYPES } from '@/constant'
import { ICHI_VAULTS } from '@/constant/ichiVaults'
import { useGammaClaim } from '@/hooks/fusion/useGamma'
import { findNewIchiStrategy, useIchiClaim } from '@/hooks/fusion/useIchi'
import { useAutomaticRange } from '@/hooks/position/useAutomaticRange'
import { useGaugeHarvest, useGaugeUnstake } from '@/hooks/useGauge'
import InfoIcon from '@/icons/InfoIcon'
import GaugeManageModal from '@/modules/Position/GaugeManageModal'
import MigrateWarningModal from '@/modules/Position/MigrateWarningModal'
import RemovePositionModal from '@/modules/Position/RemovePositionModal'
import { updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { useGetAutoPoolMigration } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'
import { formatAmount, getDisplayedStrategy, getLiquidityRangeType, isInvalidAmount } from '@/utils/utils'

import APR from './APR'
import Range from './Range'

function StakedItem({ position, isXlDown }) {
  const dispatch = useDispatch()
  const t = useTranslations()
  const { push } = useRouter()

  const [removePopup, setRemovePopup] = useState(false)
  const [popup, setPopup] = useState(false)
  const [migrateWarningPopup, setMigrateWarningPopup] = useState(false)

  const { networkId } = useChainSettings()
  const { onGaugeUnstake, pending: unstakePending } = useGaugeUnstake()
  const { onGammaClaim, pending: claimPending } = useGammaClaim()
  const { onIchiClaim } = useIchiClaim()
  const { onGaugeHarvest } = useGaugeHarvest()

  const migrationOptions = useGetAutoPoolMigration({
    token0Address: position.token0.address,
    token1Address: position.token1.address,
    type: position.title,
    version: position.account.version,
  })
  const isSwapFee = useMemo(() => position?.title.includes('SwapFee'), [position])
  const migrationLink = useMemo(() => `/pools/migration?address=${position.address}&staked=true`, [position.address])
  const isSingleSided = useMemo(
    () => ICHI_VAULTS[networkId].some(v => v.address === position.address),
    [position.address, networkId],
  )

  const version = useMemo(() => position?.account?.version ?? 2, [position])
  const depositValueUSD = useMemo(
    () => (isSwapFee ? position?.account.totalUsd : position.account.stakedUsd),
    [isSwapFee, position.account.stakedUsd, position.account.totalUsd],
  )

  const handleUnstake = useCallback(
    amount => {
      onGaugeUnstake(position, amount, () => {
        setPopup(false)
      })
    },
    [onGaugeUnstake, position],
  )

  const handleHarvest = useCallback(() => {
    if (GAMMA_TYPES.includes(position.title)) {
      onGammaClaim(position)
    } else if (ICHI_TYPES.includes(position.title) && !isSingleSided) {
      onIchiClaim(position)
    } else {
      onGaugeHarvest(position)
    }
  }, [onGammaClaim, onGaugeHarvest, onIchiClaim, position, isSingleSided])

  const strategy = useMemo(
    () => ({
      title: position?.title,
      tvl: position?.tvl?.toNumber() ?? 0,
      apr: position?.gauge?.apr.toNumber() ?? 0,
      account: {
        totalLp: position?.account?.totalLp?.toNumber(),
        gaugeBalance: position?.account?.gaugeBalance?.toNumber(),
      },
      allowed: position?.allowed ? { ...position.allowed, balance: position.allowed.balance?.toNumber() } : {},
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
      gauge: {
        ...position.gauge,
        apr: position.gauge?.apr?.toNumber(),
        bribeUsd: position.gauge?.bribeUsd?.toNumber(),
        pooled0: position.gauge?.pooled0?.toNumber(),
        pooled1: position.gauge?.pooled1?.toNumber(),
        voteApr: position.gauge?.voteApr?.toNumber(),
        tvl: position.gauge?.tvl?.toNumber(),
        weight: position.gauge?.weight?.toNumber(),
        weightPercent: position.gauge?.weightPercent?.toNumber(),
        apr_list: undefined,
      },
    }),
    [
      position?.account?.gaugeBalance,
      position?.account?.totalLp,
      position?.address,
      position?.allowed,
      position?.fee,
      position?.gauge,
      position?.title,
      position?.token0,
      position?.token1,
      position?.tvl,
      position?.type,
      version,
    ],
  )

  const [priceLower, priceUpper, currentPrice] = useAutomaticRange(position, strategy, networkId)

  const handleAdd = useCallback(() => {
    dispatch(updateStrategy({ strategy }))
    dispatch(updateLiquidityRangeType({ liquidityRangeType: getLiquidityRangeType(position.title) }))
    push(
      // eslint-disable-next-line max-len
      `/pools/add-liquidity?step=3&poolAddress=${position.basePool}&back=2&title=${position.title}&staked=true&version=${version}`,
    )
  }, [dispatch, position.basePool, position.title, push, strategy, version])

  const getDisplayName = useCallback(token => (token.name === 'Wrapped BNB' ? 'WBNB' : token.symbol || 'UNKNOWN'), [])

  const renderTokenValue = useMemo(() => {
    const token0Value = isSwapFee ? position?.account?.total0?.toNumber() : position?.account?.staked0?.toNumber()
    const token1Value = isSwapFee ? position?.account?.total1?.toNumber() : position?.account?.staked1?.toNumber()

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
    isSwapFee,
    position?.account?.staked0,
    position?.account?.staked1,
    position?.account?.total0,
    position?.account?.total1,
    position.token0,
    position.token1,
  ])

  const linkAnalytics = useMemo(() => {
    const params = new URLSearchParams({
      back: '2',
      ...(position?.type === PAIR_TYPES.LSD && {
        strategy: STRATEGY_TYPES.FARM,
      }),
    })
    return `/analytics/pairs/${position?.basePool}?${params.toString()}`
  }, [position?.basePool, position?.type])

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
            <Link href={linkAnalytics}>
              <NewTextSubHeading className='text-xl font-semibold md:text-xl'>{position.symbol}</NewTextSubHeading>
            </Link>
          )}
          <Paragraph className='text-lg font-medium text-neutral-500 md:text-lg xl:text-xs xl:text-neutral-300'>
            {getDisplayedStrategy(position.title, position.version, true)}
          </Paragraph>
        </div>
      </div>
    ),
    [position.token0, position.token1, position.symbol, position.title, position.version, linkAnalytics],
  )

  const rangeCell = useMemo(
    () => (
      <div className='w-full text-center'>
        {position.type === PAIR_TYPES.LSD ? (
          isSingleSided ? (
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
          ) : position.title.includes('ICHI') || position.title.includes('Narrow_Farming') ? (
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
    [position.type, position.title, isSingleSided, t, currentPrice, priceUpper, priceLower],
  )

  const aprCell = useMemo(
    () => (
      <APR
        currentPrice={currentPrice}
        minPrice={priceLower}
        maxPrice={priceUpper}
        positionType={position.type}
        apr={position.gauge.apr}
      />
    ),
    [currentPrice, priceLower, priceUpper, position.type, position.gauge.apr],
  )

  const valueCell = useMemo(
    () => (
      <div className='flex items-center max-xl:flex-1 max-xl:justify-center'>
        <div className='flex flex-col'>
          <div className='flex items-center gap-1'>
            <TextHeading>${formatAmount(depositValueUSD)}</TextHeading>
            {renderTokenValue && (
              <>
                <InfoIcon data-tooltip-id={`value-${position.positionId}`} />
                <CustomTooltip id={`value-${position.positionId}`}>{renderTokenValue}</CustomTooltip>
              </>
            )}
          </div>
          <TextSubHeading className='font-medium xl:text-base'>{t('Value')}</TextSubHeading>
        </div>
      </div>
    ),
    [depositValueUSD, position.positionId, renderTokenValue, t],
  )

  const gaugeAlive = useGaugeAlive(position?.basePool)

  const rewardsCell = useMemo(
    () => (
      <div className='flex flex-col max-xl:flex-1 max-xl:justify-end'>
        {isSwapFee ? (
          <div className='flex items-center gap-1 max-xl:justify-end'>
            <TextHeading>Auto Compound</TextHeading>
            <InfoIcon className='h-4 w-4 stroke-neutral-400 max-xl:hidden' data-tooltip-id='AUTO_COMPOUND' />
            <CustomTooltip className='max-w-[320px]' id='AUTO_COMPOUND'>
              {t('Auto Compound tooltip')}
            </CustomTooltip>
          </div>
        ) : (
          <div className='flex items-center gap-1 max-xl:justify-end'>
            <TextHeading>${formatAmount(position?.account?.earnedUsd?.toNumber() ?? 0)}</TextHeading>
            {position?.account?.earnedUsd?.toNumber() > 0 && (
              <>
                <InfoIcon
                  className='h-4 w-4 stroke-neutral-400 max-xl:hidden'
                  data-tooltip-id={`stake-${position.address}-${position?.account?.earnedUsd?.toNumber() ?? 0}`}
                />
                <CustomTooltip id={`stake-${position.address}-${position?.account?.earnedUsd?.toNumber() ?? 0}`}>
                  <div>
                    {position.account.gaugeEarned && <p>{`${formatAmount(position.account.gaugeEarned)} THE`}</p>}
                    {position.account.earned0 && (
                      <p>{`${formatAmount(position.account.earned0)} ${position.token0.symbol}`}</p>
                    )}
                    {position.account.earned1 && (
                      <p>{`${formatAmount(position.account.earned1)} ${position.token1.symbol}`}</p>
                    )}
                    {position.account.earned2 && (
                      <p>{`${formatAmount(position.account.earned2)} ${position.reward.symbol}`}</p>
                    )}
                  </div>
                </CustomTooltip>
              </>
            )}
          </div>
        )}
        <TextSubHeading className='font-medium max-xl:text-end xl:text-base'>{t('Reward')}</TextSubHeading>
      </div>
    ),
    [isSwapFee, t, position],
  )

  const actionCell = useMemo(() => {
    let actions = (
      <>
        {/* <EmphasisButton
          className='h-8 flex-1 px-1 text-xs md:h-11 md:text-base'
          onClick={() => {
            if (position.type === PAIR_TYPES.LSD) {
              setRemovePopup(true)
            } else {
              setPopup(true)
            }
          }}
        >
          {t('Remove')}
        </EmphasisButton> */}

        <EmphasisButton
          className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
          onClick={handleHarvest}
          disabled={
            claimPending ||
            isSwapFee ||
            (!findNewIchiStrategy(position.address) && position.version === 3 && ICHI_TYPES.includes(position.title)) ||
            !position?.account?.earnedUsd?.toNumber() > 0 ||
            !gaugeAlive
          }
        >
          {t('Claim')}
        </EmphasisButton>

        <EmphasisButton className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')} onClick={handleAdd}>
          {t('Manage')}
        </EmphasisButton>
      </>
    )
    if (version === 2) {
      if (isSingleSided) {
        actions = (
          <>
            {/* <EmphasisButton className='h-8 flex-1 px-1 text-xs md:h-11 md:text-base' onClick={() => setPopup(true)}>
              {t('Unstake')}
            </EmphasisButton> */}
            <EmphasisButton
              className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')}
              onClick={handleHarvest}
              disabled={claimPending || isSwapFee}
            >
              {t('Claim')}
            </EmphasisButton>

            <EmphasisButton className={cn('h-8 flex-1 px-1 text-xs md:h-11 md:text-base')} onClick={handleAdd}>
              {t('Manage')}
            </EmphasisButton>
          </>
        )
      } else {
        actions = (
          <>
            {/* <EmphasisButton className='h-8 flex-1 px-1 text-xs md:h-11 md:text-base' onClick={() => setPopup(true)}>
              {t('Unstake')}
            </EmphasisButton> */}

            {migrationOptions?.length > 0 ? (
              <Link href={migrationLink} className='h-8 flex-1 md:h-11'>
                <PrimaryButton className='h-8 w-full px-1 text-xs md:h-11 md:text-base'>{t('Migrate')}</PrimaryButton>
              </Link>
            ) : (
              <PrimaryButton
                className='h-8 flex-1 px-1 text-xs md:h-11 md:text-base'
                onClick={() => setMigrateWarningPopup(true)}
              >
                {t('Migrate')}
              </PrimaryButton>
            )}
          </>
        )
      }
    }
    return (
      <div
        className={cn('grid w-full grid-cols-2 justify-center gap-2', version === 2 && !isSingleSided && 'grid-cols-1')}
      >
        {actions}
      </div>
    )
  }, [
    position?.account.earnedUsd,
    claimPending,
    handleAdd,
    handleHarvest,
    isSingleSided,
    isSwapFee,
    migrationLink,
    migrationOptions?.length,
    t,
    version,
    position?.title,
    position?.version,
    position?.address,
    gaugeAlive,
  ])

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
        title='Unstake LP'
        pair={position}
        balance={position.account.gaugeBalance}
        label='Unstake'
        popup={popup}
        setPopup={setPopup}
        onGaugeManage={handleUnstake}
        pending={unstakePending}
      />
      <RemovePositionModal isStaked popup={removePopup} setPopup={setRemovePopup} strategy={position} />
    </>
  )
}

export default StakedItem
