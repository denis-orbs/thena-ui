import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useMemo } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { NewTextHeading, Paragraph } from '@/components/typography'
import { rewardsContext, useGetVeRewardV2 } from '@/context/rewardsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useGuageAllHarvset } from '@/hooks/useGauge'
import usePrices from '@/hooks/usePrices'
import { useNftFeesClaim, useTheNftAccountInfo } from '@/hooks/useTheNft'
import { useClaimAll, useClaimAllV2 } from '@/hooks/useVeThe'
import { cn, formatAmount, ZERO_VALUE } from '@/lib/utils'
import { useFarmRewards } from '@/state/farmReward/store'
import { usePools } from '@/state/pools/hooks'

function ClaimableRewards() {
  const t = useTranslations()
  const prices = usePrices()
  const pools = usePools()
  const { current: currentRewardsV3 } = useContext(rewardsContext)
  const { rewards: veRewardsV3, currentMutate: refreshVetheRewardV3 } = currentRewardsV3
  const { veTHEs } = useVeTHEsContext()
  const { currentRewardsV2, refetchVetheRewardV2 } = useGetVeRewardV2()
  const { claimableUSD: theNftRewards } = useTheNftAccountInfo()
  const { rewards } = useFarmRewards()

  const { onGaugeAllHarvest, pending } = useGuageAllHarvset()
  const { handleClaimAllV2, pending: allPendingV2 } = useClaimAllV2()
  const { handleClaimAll, pending: allPendingV3 } = useClaimAll()
  const { onHarvest: onHarvestNft, pending: pendingClaimNft } = useNftFeesClaim()

  const farmedPools = useMemo(() => pools.filter(item => item.account.gaugeEarned.gt(0)), [pools])
  const filteredVeTHEs = useMemo(() => veTHEs.filter(ele => ele.rebase_amount.gt(0)), [veTHEs])

  const farmedRewards = useMemo(() => {
    let total = ZERO_VALUE
    Object.values(rewards).forEach(list => {
      list.forEach(val => {
        total = total.plus(val.amount)
      })
    })
    return total.times(prices.THE).toNumber()
  }, [prices.THE, rewards])

  const votingRewards = useMemo(() => {
    const totalV3Rewards = veRewardsV3.reduce((sum, curr) => sum.plus(curr.totalUsd), ZERO_VALUE)
    const totalV3Rebase = filteredVeTHEs.reduce(
      (sum, curr) => sum.plus(curr?.rebase_amount?.times(prices.THE)),
      ZERO_VALUE,
    )
    const totalV2Rewards = currentRewardsV2?.reduce((sum, curr) => sum.plus(curr.totalUsd), ZERO_VALUE) ?? ZERO_VALUE

    return totalV3Rewards.plus(totalV3Rebase).plus(totalV2Rewards).toNumber()
  }, [veRewardsV3, filteredVeTHEs, currentRewardsV2, prices.THE])

  const totalRewards = useMemo(
    () => farmedRewards + votingRewards + theNftRewards.toNumber(),
    [farmedRewards, theNftRewards, votingRewards],
  )

  const percentage = useMemo(
    () => ({
      farmed: totalRewards ? (farmedRewards / totalRewards) * 100 : 0,
      voting: totalRewards ? (votingRewards / totalRewards) * 100 : 0,
      theNft: totalRewards ? (theNftRewards / totalRewards) * 100 : 0,
    }),
    [farmedRewards, theNftRewards, totalRewards, votingRewards],
  )

  const onClaimAllRewards = useCallback(async () => {
    if (!pending) await onGaugeAllHarvest(farmedPools)
    if (!allPendingV2) await handleClaimAllV2(currentRewardsV2, [], () => refetchVetheRewardV2())
    if (!allPendingV3) await handleClaimAll(veRewardsV3, filteredVeTHEs, () => refreshVetheRewardV3())
    if (!pendingClaimNft) await onHarvestNft()
  }, [
    allPendingV2,
    allPendingV3,
    currentRewardsV2,
    farmedPools,
    filteredVeTHEs,
    handleClaimAll,
    handleClaimAllV2,
    onGaugeAllHarvest,
    onHarvestNft,
    pending,
    pendingClaimNft,
    refetchVetheRewardV2,
    refreshVetheRewardV3,
    veRewardsV3,
  ])

  return (
    <Box className='flex h-full flex-col justify-between gap-4 !p-4'>
      <NewTextHeading className='text-xl md:text-xl'>{t('Claimable Rewards')}</NewTextHeading>
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Paragraph
            style={{ width: percentage.farmed ? `${percentage.farmed}%` : 'fit-content' }}
            className={cn(
              'rounded-e-[4px] px-1.5 py-2 text-neutral-50 lg:text-sm',
              percentage.farmed && 'bg-primary-400 text-primary-950',
            )}
          >
            {t('Farmed')}
          </Paragraph>
          <Paragraph className='text-neutral-50 lg:text-sm'>${formatAmount(farmedRewards)}</Paragraph>
        </div>

        <div className='flex items-center gap-2'>
          <Paragraph
            style={{ width: percentage.voting ? `${percentage.voting}%` : 'fit-content' }}
            className={cn(
              'rounded-e-[4px] px-1.5 py-2 text-neutral-50 lg:text-sm',
              percentage.voting && 'bg-primary-600 text-primary-950',
            )}
          >
            {t('Voting')}
          </Paragraph>
          <Paragraph className='text-neutral-50 lg:text-sm'>${formatAmount(votingRewards)}</Paragraph>
        </div>

        <div className='flex items-center gap-2'>
          <Paragraph
            style={{ width: percentage.theNft ? `${percentage.theNft}%` : 'fit-content' }}
            className={cn(
              'rounded-e-[4px] px-1.5 py-2 text-neutral-50 lg:text-sm',
              percentage.theNft && 'bg-primary-800 text-primary-950',
            )}
          >
            {t('TheNFT')}
          </Paragraph>
          <Paragraph className='text-neutral-50 lg:text-sm'>${formatAmount(theNftRewards)}</Paragraph>
        </div>
      </div>

      <Paragraph className='text-neutral-500 max-md:text-center'>
        {t('last 24 Hours')} <span className='text-primary-600'>+ ${formatAmount(32.48)}</span>
      </Paragraph>

      <NewTextHeading className='text-neutral-500 max-md:text-center md:text-3xl'>
        {t('Total')} <span className='text-primary-300'>${formatAmount(totalRewards)}</span>
      </NewTextHeading>
      <EmphasisButton onClick={onClaimAllRewards}>{t('Claim')}</EmphasisButton>
    </Box>
  )
}

export default ClaimableRewards
