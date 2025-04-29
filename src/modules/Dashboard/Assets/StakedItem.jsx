import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'

import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import { fetchStrategyInfo } from '@/components/common/AddLiquidity/ChooseStrategy'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES } from '@/constant'
import { useGammaClaim } from '@/hooks/fusion/useGamma'
import { useIchiClaim } from '@/hooks/fusion/useIchi'
import { useGaugeHarvest, useGaugeUnstake } from '@/hooks/useGauge'
import { cn, formatAmount, getDisplayedStrategy, getLiquidityRangeType, ZERO_VALUE } from '@/lib/utils'
import GaugeManageModal from '@/modules/Position/GaugeManageModal'
import MigrateWarningModal from '@/modules/Position/MigrateWarningModal'
import RemovePositionModal from '@/modules/Position/RemovePositionModal'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
import { updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { getStrategy, useGetAutoPoolMigration } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoIcon } from '@/svgs'

import Range from './Range'

function StakedItem({ position }) {
  const { networkId } = useChainSettings()
  const [removePopup, setRemovePopup] = useState(false)
  const [popup, setPopup] = useState(false)
  const [migrateWarningPopup, setMigrateWarningPopup] = useState(false)

  const { onGaugeUnstake, pending: unstakePending } = useGaugeUnstake()
  const { onGammaClaim, pending: claimPending } = useGammaClaim()
  const { onIchiClaim } = useIchiClaim()
  const { onGaugeHarvest } = useGaugeHarvest()
  const { addReward } = useFarmRewards()
  const { push } = useRouter()

  useEffect(() => {
    if (!position || position.version === 2) return

    const type = getStrategy(position.title)
    let args = null
    let amount = ZERO_VALUE
    if (type === 'classic' || type === 'stable') {
      args = position.gauge.address
      amount = position.account.gaugeEarned
    } else if (type === 'gamma' || type === 'ichi') {
      args = position.address
      amount = position.account.gaugeEarned
    }

    if (amount.isZero()) return
    addReward({
      type,
      args,
      amount,
      version: position.version,
      key: getKeyFromTokenAddress(type, [position.token0.address, position.token1.address]),
    })
  }, [addReward, position])

  const migrationOptions = useGetAutoPoolMigration({
    token0Address: position.token0.address,
    token1Address: position.token1.address,
    type: position.title,
    version: position.account.version,
  })
  const isSwapFee = position?.title.includes('SwapFee')
  const migrationLink = `/pools/migration?address=${position.address}&staked=true`

  const dispatch = useDispatch()
  const t = useTranslations()

  const version = position?.account?.version ?? 2
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

  const handleHavest = useCallback(() => {
    if (GAMMA_TYPES.includes(position.title)) {
      onGammaClaim(position)
    } else if (ICHI_TYPES.includes(position.title)) {
      onIchiClaim(position)
    } else {
      onGaugeHarvest(position)
    }
  }, [onGammaClaim, onGaugeHarvest, onIchiClaim, position])

  const strategy = useMemo(
    () => ({
      title: position?.title,
      tvl: position?.tvl?.toNumber() ?? 0,
      apr: position?.gauge?.apr.toNumber() ?? 0,
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

  const handleAdd = useCallback(() => {
    dispatch(updateStrategy({ strategy }))
    dispatch(updateLiquidityRangeType({ liquidityRangeType: getLiquidityRangeType(position.title) }))
    push(`/pools/add-liquidity?step=3&poolAddress=${position.basePool}&back=1`)
  }, [dispatch, position.basePool, position.title, push, strategy])

  const { data: preset } = useSWR(
    strategy.address &&
      (GAMMA_TYPES.includes(strategy.title) || strategy.title === 'DefiEdge' || ICHI_TYPES.includes(strategy.title)) &&
      position && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy),
    { refreshInterval: 0 },
  )

  return (
    <div className='flex flex-col items-center justify-between gap-4  py-4 lg:flex-row lg:py-2'>
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
        <div className='flex flex-row justify-between max-lg:w-full max-lg:items-center lg:flex-col'>
          <NewTextSubHeading className='text-xl font-semibold md:text-xl'>{position.symbol}</NewTextSubHeading>
          <Paragraph className='text-xl max-lg:font-archia max-md:font-semibold lg:text-xs'>
            {getDisplayedStrategy(position.title)}
          </Paragraph>
        </div>
      </div>
      <div className='w-full min-w-[146px] text-center lg:w-[17%]'>
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
          <TextHeading>{formatAmount(position.gauge.apr)}%</TextHeading>
          <TextSubHeading className=''>{t('APR')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 items-center max-lg:justify-center'>
          <div className='flex flex-col'>
            <TextHeading>${formatAmount(depositValueUSD)}</TextHeading>
            <TextSubHeading className=''>{t('Value')}</TextSubHeading>
          </div>
        </div>
        <div className='flex w-1/3 flex-col max-lg:justify-end'>
          {isSwapFee ? (
            <div className='flex items-center gap-1 max-lg:justify-end'>
              <TextHeading>Auto Compound</TextHeading>
              <InfoIcon className='h-4 w-4 stroke-neutral-400 max-lg:hidden' data-tooltip-id='AUTO_COMPOUND' />
              <CustomTooltip className='max-w-[320px]' id='AUTO_COMPOUND'>
                {t('Auto Compound tooltip')}
              </CustomTooltip>
            </div>
          ) : (
            <div className='flex items-center gap-1 max-lg:justify-end'>
              <TextHeading>${formatAmount(position.account.earnedUsd)}</TextHeading>
              {position.account.earnedUsd.gt(0) && (
                <>
                  <InfoIcon
                    className='h-4 w-4 stroke-neutral-400 max-lg:hidden'
                    data-tooltip-id={`stake-${position.address}-${position.account.earnedUsd}`}
                  />
                  <CustomTooltip id={`stake-${position.address}-${position.account.earnedUsd}`}>
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
          <TextSubHeading className='max-lg:text-end'>{t('Reward')}</TextSubHeading>
        </div>
      </div>
      <div className='flex w-full justify-center gap-2 lg:w-[24%] lg:max-w-[269px]'>
        {version === 2 ? (
          // Version 2 actions
          <>
            <EmphasisButton className='h-8 w-full flex-1 text-xs md:h-11 md:text-base' onClick={() => setPopup(true)}>
              {t('Unstake')}
            </EmphasisButton>

            {migrationOptions && migrationOptions.length > 0 ? (
              <Link href={migrationLink} className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'>
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
        ) : (
          // Version 3 actions
          <>
            {position.type === PAIR_TYPES.LSD ? (
              <OutlinedButton
                className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
                onClick={() => setRemovePopup(true)}
              >
                {t('Remove')}
              </OutlinedButton>
            ) : (
              <EmphasisButton className='h-8 w-full flex-1 text-xs md:h-11 md:text-base' onClick={() => setPopup(true)}>
                {t('Unstake')}
              </EmphasisButton>
            )}

            <PrimaryButton
              className={cn('h-8 w-full flex-1 text-xs md:h-11 md:text-base', isSwapFee && 'hidden')}
              onClick={handleHavest}
              disabled={claimPending || position.account.earnedUsd.isZero()}
            >
              {t('Harvest')}
            </PrimaryButton>

            <EmphasisButton className={cn('h-8 w-full flex-1 text-xs md:h-11 md:text-base')} onClick={handleAdd}>
              {t('Add')}
            </EmphasisButton>
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
        title='Unstake LP'
        pair={position}
        balance={position.account.gaugeBalance}
        label='Unstake'
        popup={popup}
        setPopup={setPopup}
        onGaugeManage={handleUnstake}
        pending={unstakePending}
      />

      <RemovePositionModal popup={removePopup} setPopup={setRemovePopup} strategy={position} />
    </div>
  )
}

export default StakedItem
