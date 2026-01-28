import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, THE_LOGO, UNKNOWN_LOGO } from '@/constant'
import { ICHI_VAULTS } from '@/constant/ichiVaults'
import { useGammaClaim, useStakeGamma } from '@/hooks/fusion/useGamma'
import { findNewIchiStrategy, useIchiClaim, useIchiManageV3 } from '@/hooks/fusion/useIchi'
import { useGaugeHarvest, useGaugeStake } from '@/hooks/useGauge'
import { useTokenUSDValue } from '@/hooks/usePrices'
import useWallet from '@/hooks/useWallet'
import RemovePositionModal from '@/modules/Position/RemovePositionModal'
import cn from '@/utils/classes'
import { formatAmount, ZERO_VALUE } from '@/utils/utils'

const calculateRewardData = (position, isSwapFee) => {
  if (position?.staked) {
    if (isSwapFee) {
      return {
        totalRewardUsd: null, // Auto compound case
        isAutoCompound: true,
        rewards: [],
      }
    }
    const rewards = []

    // Gauge reward (THE tokens)
    if (position?.account.gaugeEarned) {
      rewards.push({
        amount: position?.account.gaugeEarned,
        symbol: 'THE',
        logoURI: THE_LOGO,
        type: 'gauge',
      })
    }

    // Token0 reward
    if (position?.account.earned0) {
      rewards.push({
        amount: position?.account.earned0,
        symbol: position?.token0.symbol,
        logoURI: position?.token0.logoURI,
        type: 'token0',
      })
    }

    // Token1 reward
    if (position?.account.earned1) {
      rewards.push({
        amount: position?.account.earned1,
        symbol: position?.token1.symbol,
        logoURI: position?.token1.logoURI,
        type: 'token1',
      })
    }

    // Additional reward token
    if (position?.account.earned2 && position?.reward) {
      rewards.push({
        amount: position?.account.earned2,
        symbol: position?.reward.symbol,
        type: 'additional',
        logoURI: position?.reward.logoURI,
      })
    }

    return {
      totalRewardUsd: position?.account.earnedUsd,
      isAutoCompound: false,
      rewards,
    }
  }
  const reward0 = position?.account.token0claimable

  const reward1 = position?.account.token1claimable

  const fees0 = reward0?.times(position?.token0.price) || ZERO_VALUE
  const fees1 = reward1?.times(position?.token1.price) || ZERO_VALUE
  const totalFeesUsd = fees0.plus(fees1)

  const rewards = []

  if (reward0 && reward0.gt(0)) {
    rewards.push({
      amount: reward0,
      symbol: position?.token0.symbol,
      logoURI: position?.token0.logoURI,
      type: 'fee0',
    })
  }

  if (reward1 && reward1.gt(0)) {
    rewards.push({
      amount: reward1,
      symbol: position?.token1.symbol,
      logoURI: position?.token1.logoURI,
      type: 'fee1',
    })
  }

  return {
    totalRewardUsd: totalFeesUsd,
    isAutoCompound: false,
    rewards,
  }
}

function AutoPositionInfo({ position, baseCurrency, quoteCurrency }) {
  const { chainId } = useWallet()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const t = useTranslations()
  const isSwapFee = useMemo(() => position?.title.includes('SwapFee'), [position])
  const [removePopup, setRemovePopup] = useState(false)
  const { onGammaClaim, pending: claimPending } = useGammaClaim()
  const { onIchiClaim } = useIchiClaim()
  const { onGaugeHarvest } = useGaugeHarvest()

  const { onGaugeStake, pending: stakePending } = useGaugeStake()
  const { stakeIchiPool, pending: stakeIchiPending } = useIchiManageV3()
  const { stakeGamma, pending: stakeGammaPending } = useStakeGamma()
  const isSingleSided = useMemo(
    () => ICHI_VAULTS[chainId].some(v => v.address === position?.address),
    [position?.address, chainId],
  )

  const handleStake = useCallback(
    amount => {
      if (position?.version === 3) {
        // Gamma pools
        if (GAMMA_TYPES.includes(position?.title)) {
          stakeGamma({
            position,
            amount,
          })
        } else {
          // Ichi pools
          stakeIchiPool({
            vaultAddress: position?.address,
            amount,
          })
        }
        return
      }

      // for ichi single sided
      onGaugeStake(position, amount)
    },
    [position, stakeGamma, stakeIchiPool, onGaugeStake],
  )

  const handleHarvest = useCallback(() => {
    if (GAMMA_TYPES.includes(position?.title)) {
      onGammaClaim(position)
    } else if (ICHI_TYPES.includes(position?.title) && !isSingleSided) {
      onIchiClaim(position)
    } else {
      onGaugeHarvest(position)
    }
  }, [position, isSingleSided, onGammaClaim, onIchiClaim, onGaugeHarvest])

  const depositValueUSD = useMemo(() => {
    if (!position?.staked) return position?.account.totalUsd.minus(position?.account.stakedUsd)
    return isSwapFee ? position?.account.totalUsd : position?.account.stakedUsd
  }, [isSwapFee, position?.account.stakedUsd, position?.account.totalUsd, position?.staked])

  const rewardsData = calculateRewardData(position, isSwapFee)
  const ButtonsDisplay = useMemo(
    () => (
      <div className='flex w-full gap-2'>
        <EmphasisButton className='flex-1' onClick={() => setRemovePopup(true)}>
          {t('Withdraw')}
        </EmphasisButton>
        <EmphasisButton
          className={cn('flex-1', {
            hidden: ICHI_TYPES.includes(position?.title) && position?.version === 3,
          })}
          disabled={claimPending || isSwapFee || !rewardsData.totalRewardUsd.gt(0)}
          onClick={handleHarvest}
        >
          {t('Claim')}
        </EmphasisButton>
        {!position?.staked && (
          <PrimaryButton
            className='flex-1 text-nowrap'
            onClick={() => handleStake(position?.account?.walletBalance.dp(18).toString(10))}
            // TODO: temporary block and do no deposit for Ichi pools until update new ICHI strategies
            disabled={
              stakePending ||
              stakeIchiPending ||
              stakeGammaPending ||
              // (ICHI_TYPES.includes(position?.title) && position?.version === 3)
              (ICHI_TYPES.includes(position?.title) &&
                !findNewIchiStrategy(position?.address) &&
                position?.version === 3)
            }
          >
            {t('Earn $THE')}
          </PrimaryButton>
        )}
      </div>
    ),
    [
      claimPending,
      handleHarvest,
      handleStake,
      isSwapFee,
      position?.account?.walletBalance,
      position?.address,
      position?.staked,
      position?.title,
      position?.version,
      rewardsData.totalRewardUsd,
      stakeGammaPending,
      stakeIchiPending,
      stakePending,
      t,
    ],
  )

  const renderTokenValue = useMemo(() => {
    let token0Value = isSwapFee ? position?.account?.total0?.toNumber() : position?.account?.staked0?.toNumber()
    let token1Value = isSwapFee ? position?.account?.total1?.toNumber() : position?.account?.staked1?.toNumber()
    if (!position?.staked) {
      token0Value = BigNumber(position?.account.total0).minus(position?.account.staked0)
      token1Value = BigNumber(position?.account.total1).minus(position?.account.staked1)
    }

    // calculate percent
    const token0AmountUsd = getValueTokenAmountToUSD(baseCurrency.address, token0Value)
    let token0Percent = 0
    if (depositValueUSD > 0) {
      token0Percent = (token0AmountUsd / depositValueUSD) * 100
    }

    return (
      <div className='flex gap-6'>
        <div className='flex h-12 flex-1 flex-col gap-1 xl:justify-start'>
          <div className='flex items-center gap-2'>
            <CircleImage className='size-5' src={baseCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
            <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold'>
              {formatAmount(token0Value)}
            </Paragraph>
          </div>
          <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
            {t('[symbol] deposit [percent]', {
              symbol: baseCurrency.symbol,
              percent: formatAmount(token0Percent),
            })}
          </Paragraph>
        </div>

        <div className='flex h-12 flex-1 flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <CircleImage className='size-5' src={quoteCurrency.logoURI ?? UNKNOWN_LOGO} alt='quote token' />
            <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold'>
              {formatAmount(token1Value)}
            </Paragraph>
          </div>
          <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
            {t('[symbol] deposit [percent]', {
              symbol: quoteCurrency.symbol,
              percent: formatAmount(100 - token0Percent),
            })}
          </Paragraph>
        </div>
      </div>
    )
  }, [
    baseCurrency.address,
    baseCurrency.logoURI,
    baseCurrency.symbol,
    depositValueUSD,
    getValueTokenAmountToUSD,
    isSwapFee,
    position,
    quoteCurrency.logoURI,
    quoteCurrency.symbol,
    t,
  ])

  return (
    <>
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
              <TextHeading className='font-archia !text-xl !leading-6 xl:font-semibold'>
                {t('Your Position')}
              </TextHeading>
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

        {/* Second line */}
        <div className='flex w-full flex-row flex-wrap gap-4 xl:gap-6'>
          {renderTokenValue}

          <div className='flex h-12 flex-1 flex-col gap-1'>
            {rewardsData.totalRewardUsd.gt(0) ? (
              <div className='flex gap-4'>
                {(rewardsData.rewards || [])
                  .filter(reward => reward.amount.gt(0))
                  .map((reward, idx) => (
                    <div key={reward?.address ?? reward?.symbol ?? idx} className='flex flex-nowrap items-center gap-2'>
                      <CircleImage className='size-5' src={reward.logoURI ?? UNKNOWN_LOGO} alt='reward' />
                      <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
                        {formatAmount(reward.amount)}
                      </Paragraph>
                    </div>
                  ))}
                {isSwapFee && (
                  <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold text-nowrap'>
                    Auto Compound
                  </Paragraph>
                )}
              </div>
            ) : (
              <Paragraph className='text-primary-50 font-archia text-xl! leading-6! font-semibold'>0</Paragraph>
            )}
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
              {t('Rewards')}
            </Paragraph>
          </div>

          {/* APR (desktop) */}
          <div className='flex h-12 flex-1 flex-col gap-1 max-xl:hidden'>
            <Paragraph className='font-archia text-primary-600 text-xl! leading-6! font-semibold'>
              {formatAmount(position?.apr)}%
            </Paragraph>
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>{t('APR')}</Paragraph>
          </div>
        </div>
        <div className='flex w-full shrink-0 gap-2 xl:hidden'>{ButtonsDisplay}</div>
      </article>
      {position && (
        <RemovePositionModal
          isStaked={position.staked}
          popup={removePopup}
          setPopup={setRemovePopup}
          strategy={position}
        />
      )}
    </>
  )
}

export default AutoPositionInfo
