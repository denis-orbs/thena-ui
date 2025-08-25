import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { isAddress, zeroAddress } from 'viem'
import { useSimulateContract } from 'wagmi'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { pairAbi } from '@/constant/abi'
import { useGammaClaim, useStakeGamma } from '@/hooks/fusion/useGamma'
import { useGaugeHarvest, useGaugeStake, useGaugeUnstake } from '@/hooks/useGauge'
import { useClaimFees, useV1Stake } from '@/hooks/useV1Liquidity'
import { cn, formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import GaugeManageModal from '@/modules/Position/GaugeManageModal'
import RemovePositionModal from '@/modules/Position/RemovePositionModal'

// for classic, stable
function PositionInfo({ position }) {
  const t = useTranslations()
  const [removePopup, setRemovePopup] = useState(false)
  const [stakePopup, setStakePopup] = useState(false)
  const { onGaugeStake, pending: stakePending } = useGaugeStake()
  const { onGaugeUnstake, pending: unstakePending } = useGaugeUnstake()
  const { onGaugeHarvest, pending: harvestPending } = useGaugeHarvest()
  const { onGammaClaim, pending: claimPending } = useGammaClaim()
  const { stakeGamma, pending: stakeGammaPending } = useStakeGamma()
  const { onV1Stake, pending: stakeV1Pending } = useV1Stake()
  const { onClaimFees, pending: feesPending } = useClaimFees()
  const version = useMemo(() => position?.account?.version ?? 2, [position])

  const isSwapFee = useMemo(() => position?.title.includes('SwapFee'), [position])

  const handleStake = useCallback(
    amount => {
      if (version === 3) {
        // Gamma pools
        if (GAMMA_TYPES.includes(position.title)) {
          stakeGamma({
            position,
            amount,
            callback: () => setStakePopup(false),
          })
        } else if ([PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(position.type)) {
          // V1 pools
          onV1Stake(position, amount, () => setStakePopup(false))
        }
        return
      }

      onGaugeStake(position, amount, () => setStakePopup(false))
    },
    [version, onGaugeStake, position, stakeGamma, onV1Stake],
  )

  const handleUnstake = useCallback(
    amount => {
      onGaugeUnstake(position, amount, () => {
        setStakePopup(false)
      })
    },
    [onGaugeUnstake, position],
  )

  const handleHarvestStaked = useCallback(() => {
    if (GAMMA_TYPES.includes(position.title)) {
      onGammaClaim(position)
    } else {
      onGaugeHarvest(position)
    }
  }, [onGammaClaim, onGaugeHarvest, position])

  const handleClaimUnstaked = useCallback(() => {
    onClaimFees(position)
  }, [onClaimFees, position])

  const ButtonsDisplay = useMemo(() => {
    const hasGauge = position.gauge?.address !== zeroAddress
    return (
      <div className='flex w-full gap-2'>
        <EmphasisButton className='max-xl:flex-1' onClick={() => setRemovePopup(true)}>
          {t('Withdraw')}
        </EmphasisButton>
        <EmphasisButton
          disabled={claimPending || harvestPending || feesPending}
          className='max-xl:flex-1'
          onClick={position.staked ? handleHarvestStaked : handleClaimUnstaked}
        >
          {t('Claim')}
        </EmphasisButton>
        {hasGauge && position.staked && (
          <EmphasisButton disabled={unstakePending} className='max-xl:flex-1' onClick={() => setStakePopup(true)}>
            {t('Unstake')}
          </EmphasisButton>
        )}
        {hasGauge && !position.staked && (
          <PrimaryButton
            disabled={stakePending || stakeV1Pending || stakeGammaPending}
            className='max-xl:flex-1'
            onClick={() => setStakePopup(true)}
          >
            {t('Stake')}
          </PrimaryButton>
        )}
      </div>
    )
  }, [
    claimPending,
    feesPending,
    handleClaimUnstaked,
    handleHarvestStaked,
    harvestPending,
    position.staked,
    position.gauge?.address,
    stakeGammaPending,
    stakePending,
    stakeV1Pending,
    t,
    unstakePending,
  ])

  const getDisplayName = useCallback(token => (token.name === 'Wrapped BNB' ? 'WBNB' : token.symbol || 'UNKNOWN'), [])

  const depositValueUSD = useMemo(
    () =>
      position.staked
        ? isSwapFee
          ? position.account.totalUsd
          : position.account.stakedUsd
        : position.account.totalUsd.minus(position.account.stakedUsd),
    [position.account.stakedUsd, position.account.totalUsd, position.staked, isSwapFee],
  )

  const token0Percent = useMemo(() => {
    let token0InUsd = position.account.staked0.times(position.token0.price)
    if (!position.staked) {
      token0InUsd = position.account.total0.minus(position.account.staked0).times(position.token0.price)
    }
    return token0InUsd.div(depositValueUSD).times(100).toFixed(2)
  }, [depositValueUSD, position.account.staked0, position.account.total0, position.staked, position.token0.price])

  const tokensAmount = useMemo(() => {
    let token0Value = isSwapFee ? position?.account?.total0 : position?.account?.staked0
    let token1Value = isSwapFee ? position?.account?.total1 : position?.account?.staked1
    if (!position.staked) {
      token0Value = BigNumber(position.account.total0).minus(position.account.staked0)
      token1Value = BigNumber(position.account.total1).minus(position.account.staked1)
    }

    const hasInvalidAmounts = isInvalidAmount(token0Value) && isInvalidAmount(token1Value)
    if (hasInvalidAmounts) return null
    return {
      token0: {
        amount: token0Value,
        symbol: getDisplayName(position.token0),
        logoUri: position.token0.logoURI,
      },
      token1: {
        amount: token1Value,
        symbol: getDisplayName(position.token1),
        logoUri: position.token1.logoURI,
      },
    }
  }, [
    getDisplayName,
    isSwapFee,
    position.account.staked0,
    position.account.staked1,
    position.account.total0,
    position.account.total1,
    position.staked,
    position.token0,
    position.token1,
  ])

  const rewardsStaked = useMemo(() => {
    if (!position.staked) return null
    return (
      <>
        {position?.account?.gaugeEarned && (
          <div className='flex flex-row items-center gap-2'>
            <CircleImage className='size-5' src='https://cdn.thena.fi/assets/THE.png' alt='base token' />
            <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
              {formatAmount(position?.account?.gaugeEarned)}
            </Paragraph>
          </div>
        )}
        {position?.account?.earned0 && (
          <div className='flex flex-row items-center gap-2'>
            <CircleImage className='size-5' src={position?.token0?.logoURI || UNKNOWN_LOGO} alt='reward token' />
            <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
              {formatAmount(position?.account?.earned0)}
            </Paragraph>
          </div>
        )}
        {position?.account?.earned1 && (
          <div className='flex flex-row items-center gap-2'>
            <CircleImage className='size-5' src={position?.token1?.logoURI || UNKNOWN_LOGO} alt='reward token' />
            <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
              {formatAmount(position?.account?.earned1)}
            </Paragraph>
          </div>
        )}
        {position?.account?.earned2 && (
          <div className='flex flex-row items-center gap-2'>
            <CircleImage className='size-5' src={position?.reward?.logoURI || UNKNOWN_LOGO} alt='reward token' />
            <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
              {formatAmount(position?.account?.earned2)}
            </Paragraph>
          </div>
        )}
        {position?.account?.earned3 && (
          <div className='flex flex-row items-center gap-2'>
            <CircleImage className='size-5' src={position?.reward2?.logoURI || UNKNOWN_LOGO} alt='reward token' />
            <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
              {formatAmount(position?.account?.earned3)}
            </Paragraph>
          </div>
        )}
      </>
    )
  }, [
    position?.staked,
    position?.account?.gaugeEarned,
    position?.account?.earned0,
    position?.account?.earned1,
    position?.account?.earned2,
    position?.account?.earned3,
    position?.token0?.logoURI,
    position?.token1?.logoURI,
    position?.reward?.logoURI,
    position?.reward2?.logoURI,
  ])

  const isV1Pool = useMemo(() => [PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(position.title), [position.title])
  const { data: fees } = useSimulateContract({
    abi: pairAbi,
    address: position.address,
    functionName: 'claimFees',
    query: {
      enable: isV1Pool && isAddress(position.address),
    },
  })
  const rewardsNotstaked = useMemo(() => {
    if (position.staked) return null
    const _reward0 = isV1Pool
      ? fromWei(fees?.result?.[0] ?? 0n, position.token0.decimals)
      : position.account.token0claimable
    const _reward1 = isV1Pool
      ? fromWei(fees?.result?.[1] ?? 0n, position.token1.decimals)
      : position.account.token1claimable

    return (
      <div className='flex flex-row gap-4'>
        <div className='flex flex-row items-center gap-2'>
          <CircleImage className='size-5' src={position.token0.logoURI} alt='base token' />
          <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
            {formatAmount(_reward0)}
          </Paragraph>
        </div>
        <div className='flex flex-row items-center gap-2'>
          <CircleImage className='size-5' src={position.token1.logoURI} alt='quote token' />
          <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
            {formatAmount(_reward1)}
          </Paragraph>
        </div>
      </div>
    )
  }, [
    fees?.result,
    isV1Pool,
    position.account.token0claimable,
    position.account.token1claimable,
    position.staked,
    position.token0.decimals,
    position.token0.logoURI,
    position.token1.decimals,
    position.token1.logoURI,
  ])

  return (
    <article
      className={cn(
        'bg-chart-gradient inline-flex w-full flex-col items-start gap-4 rounded-lg px-4 py-4 font-medium outline-1 outline-neutral-600',
        'xl:ml-auto xl:w-fit xl:self-start xl:px-6',
      )}
    >
      {/* Top line: title/amount (left) + buttons (right) */}
      <div className='flex w-full flex-col gap-2 xl:flex-row xl:items-center xl:justify-between'>
        {/* Left block */}
        <div className='flex min-w-0 flex-row justify-between gap-4'>
          <div className='flex flex-col gap-2'>
            <TextHeading className='font-archia !text-xl !leading-6 xl:font-semibold'>{t('Your Position')}</TextHeading>
            <Paragraph className='text-sm! font-normal! text-neutral-500'>${formatAmount(depositValueUSD)}</Paragraph>
          </div>

          {/* APR (mobile) */}
          <div className='flex flex-col justify-between gap-2 xl:hidden'>
            <Paragraph className='font-archia text-primary-600 text-xl! leading-6! font-semibold'>
              {formatAmount(position?.apr)}%
            </Paragraph>
            <Paragraph className='text-sm! font-medium text-nowrap text-neutral-500'>{t('APR')}</Paragraph>
          </div>
        </div>

        {/* Buttons - fixed on the right, width doesn’t depend on 2nd line */}
        <div className='flex w-auto shrink-0 justify-end gap-2 max-xl:hidden'>{ButtonsDisplay}</div>
      </div>
      <div className='flex w-full flex-wrap gap-4 xl:gap-6'>
        <div className='flex h-12 flex-1 flex-col gap-1 xl:justify-start'>
          <div className='flex items-center gap-2'>
            <CircleImage className='size-5' src={tokensAmount?.token0?.logoUri ?? UNKNOWN_LOGO} alt='base token' />
            <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold'>
              {formatAmount(tokensAmount?.token0?.amount)}
            </Paragraph>
          </div>
          <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
            {t('[symbol] deposit [percent]', {
              symbol: tokensAmount?.token0?.symbol,
              percent: formatAmount(token0Percent),
            })}
          </Paragraph>
        </div>
        <div className='flex h-12 flex-1 flex-col gap-1 xl:justify-start'>
          <div className='flex items-center gap-2'>
            <CircleImage className='size-5' src={tokensAmount?.token1?.logoUri ?? UNKNOWN_LOGO} alt='quote token' />
            <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold'>
              {formatAmount(tokensAmount?.token1?.amount)}
            </Paragraph>
          </div>
          <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
            {t('[symbol] deposit [percent]', {
              symbol: tokensAmount?.token1?.symbol,
              percent: formatAmount(100 - token0Percent),
            })}
          </Paragraph>
        </div>
        <div className='flex h-12 flex-1 flex-col gap-1 xl:justify-start'>
          <div className='leading-6!'>{rewardsStaked ?? rewardsNotstaked}</div>
          <Paragraph className='text-sm! font-medium text-neutral-500'>{t('Rewards')}</Paragraph>
        </div>
        <div className='flex h-12 flex-1 flex-col gap-1 max-xl:hidden'>
          <Paragraph className='font-archia text-primary-600 text-xl! leading-6! font-semibold'>
            {formatAmount(position.apr)}%
          </Paragraph>
          <Paragraph className='text-sm! font-medium text-neutral-500'>{t('APR')}</Paragraph>
        </div>
      </div>
      <div className='flex w-full shrink-0 justify-end gap-2 xl:hidden'>{ButtonsDisplay}</div>
      <GaugeManageModal
        title={position.staked ? 'Unstake LP' : 'Stake LP'}
        pair={position}
        balance={position.staked ? position.account.gaugeBalance : position.account.walletBalance}
        label={position.staked ? 'Unstake' : 'Stake'}
        popup={stakePopup}
        setPopup={setStakePopup}
        onGaugeManage={position.staked ? handleUnstake : handleStake}
        pending={stakePending || stakeV1Pending || stakeGammaPending}
      />
      <RemovePositionModal
        isStaked={position.staked}
        popup={removePopup}
        setPopup={setRemovePopup}
        strategy={position}
      />
    </article>
  )
}

export default PositionInfo
