import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useMemo } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { NewTextHeading, Paragraph } from '@/components/typography'
import { rewardsContext, useGetVeRewardV2 } from '@/context/rewardsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useGaugeAllHarvest } from '@/hooks/useGauge'
import usePrices from '@/hooks/usePrices'
import { useNftClaimAllReward, useTheNftAccountInfo } from '@/hooks/useTheNft'
import { useClaimAll, useClaimAllV2 } from '@/hooks/useVeThe'
import { cn, formatAmount, ZERO_VALUE } from '@/lib/utils'
import { useFarmRewards } from '@/state/farmReward/store'

import SectionDivider from '../SectionDivider'

function ClaimableRewards() {
  const t = useTranslations()
  const prices = usePrices()
  const { current: currentRewardsV3 } = useContext(rewardsContext)
  const { rewards: veRewardsV3, currentMutate: refreshVetheRewardV3 } = currentRewardsV3
  const { veTHEs } = useVeTHEsContext()
  const { currentRewardsV2, refetchVetheRewardV2 } = useGetVeRewardV2()
  const { claimableUSD, pendingReward: royaltyRewards } = useTheNftAccountInfo()
  const { rewards } = useFarmRewards()

  const { onGaugeAllHarvest, pending } = useGaugeAllHarvest()
  const { handleClaimAllV2, pending: allPendingV2 } = useClaimAllV2()
  const { handleClaimAll, pending: allPendingV3 } = useClaimAll()
  const { onTheNftClaim, pending: theNftPending } = useNftClaimAllReward()

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

  const totalVotingV2Rewards = useMemo(
    () => currentRewardsV2?.reduce((sum, curr) => sum.plus(curr.totalUsd), ZERO_VALUE) ?? ZERO_VALUE,
    [currentRewardsV2],
  )

  const totalVotingV3Rewards = useMemo(() => {
    const totalV3Rewards = veRewardsV3.reduce((sum, curr) => sum.plus(curr.totalUsd), ZERO_VALUE)
    const totalV3Rebase = filteredVeTHEs.reduce(
      (sum, curr) => sum.plus(curr?.rebase_amount?.times(prices.THE)),
      ZERO_VALUE,
    )
    return totalV3Rewards.plus(totalV3Rebase)
  }, [filteredVeTHEs, prices.THE, veRewardsV3])

  const votingRewards = useMemo(
    () => totalVotingV2Rewards.plus(totalVotingV3Rewards).toNumber(),
    [totalVotingV2Rewards, totalVotingV3Rewards],
  )

  const theNftRewards = useMemo(() => claimableUSD.plus(royaltyRewards), [claimableUSD, royaltyRewards])

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
    // Harvest pool rewards
    if (!pending && farmedRewards > 0) {
      await onGaugeAllHarvest()
    }

    // Harvest voting V2 rewards
    if (!allPendingV2 && totalVotingV2Rewards.gt(0)) {
      await handleClaimAllV2(currentRewardsV2, [], () => refetchVetheRewardV2())
    }

    // Harvest voting V3 rewards
    if (!allPendingV3 && totalVotingV3Rewards.gt(0)) {
      await handleClaimAll(veRewardsV3, filteredVeTHEs, () => refreshVetheRewardV3())
    }

    // Harvest theNft royalty rewards
    if (!theNftPending && theNftRewards.gt(0)) await onTheNftClaim()
  }, [
    pending,
    farmedRewards,
    allPendingV2,
    totalVotingV2Rewards,
    allPendingV3,
    totalVotingV3Rewards,
    theNftPending,
    theNftRewards,
    onTheNftClaim,
    onGaugeAllHarvest,
    handleClaimAllV2,
    currentRewardsV2,
    refetchVetheRewardV2,
    handleClaimAll,
    veRewardsV3,
    filteredVeTHEs,
    refreshVetheRewardV3,
  ])

  return (
    totalRewards > 0 && (
      <>
        <Box className='flex h-full flex-col justify-between gap-4 bg-cover bg-no-repeat !p-4 max-lg:bg-[url("/images/claim-reward-mobile-bg.png")]'>
          <NewTextHeading className='text-xl md:text-xl'>{t('Claimable Rewards')}</NewTextHeading>
          <div className='flex h-[124px] flex-col justify-center gap-2 md:h-[224px] md:gap-4 md:py-[18px]'>
            {farmedRewards > 0 && (
              <div className='flex max-h-[52px] flex-1 items-center gap-2'>
                <Paragraph
                  style={{
                    width: percentage.farmed
                      ? `${percentage.farmed < 24 ? 24 : percentage.farmed > 82 ? 82 : percentage.farmed}%`
                      : 'fit-content',
                  }}
                  className={cn(
                    'flex h-full items-center rounded-e-[4px] px-1.5 py-2 text-neutral-50 lg:text-sm',
                    percentage.farmed && 'bg-primary-400 text-primary-950',
                  )}
                >
                  {t('Farmed')}
                </Paragraph>
                <Paragraph className='text-neutral-50 lg:text-sm'>${formatAmount(farmedRewards)}</Paragraph>
              </div>
            )}

            {votingRewards > 0 && (
              <div className='flex max-h-[52px] flex-1 items-center gap-2'>
                <Paragraph
                  style={{
                    width: percentage.voting
                      ? `${percentage.voting < 15 ? 15 : percentage.voting > 82 ? 82 : percentage.voting}%`
                      : 'fit-content',
                  }}
                  className={cn(
                    'flex h-full max-w-[85%] items-center rounded-e-[4px] px-1.5 py-2 text-neutral-50 lg:text-sm',
                    percentage.voting && 'bg-primary-600 text-primary-950',
                  )}
                >
                  {t('Voting')}
                </Paragraph>
                <Paragraph className='text-neutral-50 lg:text-sm'>${formatAmount(votingRewards)}</Paragraph>
              </div>
            )}

            {theNftRewards > 0 && (
              <div className='flex max-h-[52px] flex-1 items-center gap-2'>
                <Paragraph
                  style={{
                    width: percentage.theNft
                      ? `${percentage.theNft < 25 ? 25 : percentage.theNft > 82 ? 82 : percentage.theNft}%`
                      : 'fit-content',
                  }}
                  className={cn(
                    'flex h-full items-center rounded-e-[4px] px-1.5 py-2 text-neutral-50 lg:text-sm',
                    percentage.theNft && 'bg-primary-800 text-primary-950',
                  )}
                >
                  {t('TheNFT')}
                </Paragraph>
                <Paragraph className='text-neutral-50 lg:text-sm'>${formatAmount(theNftRewards)}</Paragraph>
              </div>
            )}
          </div>

          {/* FIXME: show last 24 hours */}
          {/* <Paragraph className='text-neutral-500 max-md:text-center'>
            {t('last 24 Hours')} <span className='text-primary-600'>+ ${formatAmount(32.48)}</span>
          </Paragraph> */}

          <div className='flex flex-col gap-4'>
            <NewTextHeading className='flex gap-4 text-neutral-500 max-md:justify-center max-md:text-center md:text-3xl'>
              <span>{t('Total')}</span>
              <span className='text-primary-300'>${formatAmount(totalRewards)}</span>
            </NewTextHeading>

            <div className='flex gap-2 [&>button]:flex-1'>
              <EmphasisButton className='h-8 text-xs md:h-11 md:text-base' onClick={onClaimAllRewards}>
                {t('Claim')}
              </EmphasisButton>
            </div>
          </div>
        </Box>

        <SectionDivider />
      </>
    )
  )
}

export default ClaimableRewards
