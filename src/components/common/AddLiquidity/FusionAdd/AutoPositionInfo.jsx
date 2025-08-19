import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import { EmphasisButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, UNKNOWN_LOGO } from '@/constant'
import { ICHI_VAULTS } from '@/constant/ichiVaults'
import { useGammaClaim, useStakeGamma } from '@/hooks/fusion/useGamma'
import { useIchiClaim, useIchiManageV3 } from '@/hooks/fusion/useIchi'
import { useGaugeHarvest, useGaugeStake, useGaugeUnstake } from '@/hooks/useGauge'
import { useTokenUSDValue } from '@/hooks/usePrices'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount, ZERO_VALUE } from '@/lib/utils'
import GaugeManageModal from '@/modules/Position/GaugeManageModal'
import RemovePositionModal from '@/modules/Position/RemovePositionModal'

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
        logoURI: 'https://cdn.thena.fi/assets/THE.png',
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
  const [stakePopup, setStakePopup] = useState(false)
  const [removePopup, setRemovePopup] = useState(false)
  const { onGaugeUnstake, pending: unstakePending } = useGaugeUnstake()
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
  const handleUnstake = useCallback(
    amount => {
      onGaugeUnstake(position, amount, () => {
        setStakePopup(false)
      })
    },
    [onGaugeUnstake, position],
  )

  const handleStake = useCallback(
    amount => {
      if (position?.version === 3) {
        // Gamma pools
        if (GAMMA_TYPES.includes(position?.title)) {
          stakeGamma({
            position,
            amount,
            callback: () => setStakePopup(false),
          })
        } else {
          // Ichi pools
          stakeIchiPool({
            vaultAddress: position?.address,
            amount,
            callback: () => setStakePopup(false),
          })
        }
        return
      }

      // for ichi single sided
      onGaugeStake(position, amount, () => setStakePopup(false))
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
  const ButtonsDisplay = useMemo(() => {
    const hasGauge = position?.gauge?.address !== zeroAddress
    return (
      <div className='flex w-full gap-2'>
        <EmphasisButton className={cn('h-8 flex-1 text-xs md:h-11 md:text-base')} onClick={() => setRemovePopup(true)}>
          {t('Withdraw')}
        </EmphasisButton>
        <EmphasisButton
          disabled={claimPending || isSwapFee || !rewardsData.totalRewardUsd.gt(0)}
          onClick={handleHarvest}
        >
          {t('Claim')}
        </EmphasisButton>
        {position?.staked && hasGauge && <EmphasisButton onClick={() => setStakePopup(true)}>UnStaked</EmphasisButton>}
        {hasGauge && !position?.staked && (
          <EmphasisButton
            onClick={() => setStakePopup(true)}
            disabled={stakePending || stakeIchiPending || stakeGammaPending}
          >
            {t('Staked')}
          </EmphasisButton>
        )}
      </div>
    )
  }, [
    claimPending,
    handleHarvest,
    isSwapFee,
    position?.gauge?.address,
    position?.staked,
    rewardsData.totalRewardUsd,
    stakeGammaPending,
    stakeIchiPending,
    stakePending,
    t,
  ])

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
        <div className='flex h-12 flex-1 flex-col gap-1 lg:justify-start'>
          <div className='flex items-center gap-2'>
            <CircleImage className='size-5' src={baseCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
            <Paragraph className='text-primary-50 font-archia text-xl! font-semibold'>
              {formatAmount(token0Value)}
            </Paragraph>
          </div>
          <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 lg:text-sm'>
            {t('[symbol] deposit [percent]', {
              symbol: baseCurrency.symbol,
              percent: formatAmount(token0Percent),
            })}
          </Paragraph>
        </div>

        <div className='flex h-12 flex-1 flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <CircleImage className='size-5' src={quoteCurrency.logoURI ?? UNKNOWN_LOGO} alt='quote token' />
            <Paragraph className='text-primary-50 font-archia text-xl! font-semibold'>
              {formatAmount(token1Value)}
            </Paragraph>
          </div>
          <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 lg:text-sm'>
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
          'bg-chart-gradient flex flex-col items-start gap-4 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-4 font-medium lg:px-6',
        )}
      >
        <div className='flex w-full flex-col justify-between max-lg:gap-2 lg:flex-row lg:items-center'>
          <div className='flex flex-row justify-between gap-4'>
            <div className='flex flex-col justify-between gap-2'>
              <TextHeading className='font-archia !text-xl !leading-6 xl:font-semibold'>
                {t('Your Position')}
              </TextHeading>
              <Paragraph className='text-sm! font-normal! text-neutral-500'>${formatAmount(depositValueUSD)}</Paragraph>
            </div>
            <div className='flex flex-col justify-between gap-2 lg:hidden'>
              <Paragraph className='font-archia text-primary-600 text-xl! font-semibold'>
                {formatAmount(position?.apr)}%
              </Paragraph>
              <Paragraph className='text-sm! font-medium text-nowrap text-neutral-500'>{t('APR')}</Paragraph>
            </div>
          </div>
          <div className='flex w-full gap-2 lg:w-fit'>{ButtonsDisplay}</div>
        </div>
        <div className='flex w-full flex-row flex-wrap gap-4 lg:gap-6'>
          {renderTokenValue}
          <div className='flex h-12 flex-1 flex-col gap-1'>
            {rewardsData.totalRewardUsd.gt(0) ? (
              <div className='flex gap-4'>
                {(rewardsData.rewards || [])
                  .filter(reward => reward.amount.gt(0))
                  .map(reward => (
                    <div className='flex flex-nowrap items-center gap-2'>
                      <CircleImage className='size-5' src={reward.logoURI ?? UNKNOWN_LOGO} alt='reward' />
                      <Paragraph className='text-primary-50 font-archia text-xl! font-semibold'>
                        {formatAmount(reward.amount)}
                      </Paragraph>
                    </div>
                  ))}
                {isSwapFee && (
                  <Paragraph className='text-primary-50 font-archia text-xl! font-semibold text-nowrap'>
                    Auto Compound
                  </Paragraph>
                )}
              </div>
            ) : (
              <Paragraph className='text-primary-50 font-archia text-xl! font-semibold'>0</Paragraph>
            )}
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 lg:text-sm'>
              {t('Rewards')}
            </Paragraph>
          </div>
          <div className='flex h-12 flex-1 flex-col gap-1 max-lg:hidden'>
            <Paragraph className='font-archia text-primary-600 text-xl! font-semibold'>
              {formatAmount(position?.apr)}%
            </Paragraph>
            <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 lg:text-sm'>{t('APR')}</Paragraph>
          </div>
        </div>
      </article>
      {position && (
        <GaugeManageModal
          title={position.staked ? 'Unstake LP' : 'Stake LP'}
          pair={position}
          balance={position.staked ? position?.account.gaugeBalance : position.account.walletBalance}
          label={position.staked ? 'Unstake' : 'Stake'}
          popup={stakePopup}
          setPopup={setStakePopup}
          onGaugeManage={position.staked ? handleUnstake : handleStake}
          pending={unstakePending}
        />
      )}
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
