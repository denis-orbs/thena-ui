import { useTranslations } from 'next-intl'
import React, { useContext, useMemo } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { NewTextHeading, NewTextSubHeading, Paragraph } from '@/components/typography'
import { rewardsContext, useGetVeRewardV2 } from '@/context/rewardsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import usePrices from '@/hooks/usePrices'
import { useTheNftAccountInfo } from '@/hooks/useTheNft'
import { cn, formatAmount, ZERO_VALUE } from '@/lib/utils'

function ClaimableRewards({ farmedRewards }) {
  const t = useTranslations()
  const prices = usePrices()
  const { current: currentRewardsV3 } = useContext(rewardsContext)
  const { veTHEs } = useVeTHEsContext()
  const { rewards: veRewardsV3 } = currentRewardsV3
  const { currentRewardsV2 } = useGetVeRewardV2()
  const { claimableUSD: theNftRewards } = useTheNftAccountInfo()

  const votingRewards = useMemo(() => {
    const totalV3Rewards = veRewardsV3.reduce((sum, curr) => sum.plus(curr.totalUsd), ZERO_VALUE)
    const totalV3Rebase = veTHEs
      .filter(ele => ele.rebase_amount.gt(0))
      .reduce((sum, curr) => sum.plus(curr?.rebase_amount?.times(prices.THE)), ZERO_VALUE)
    const totalV2Rewards = currentRewardsV2?.reduce((sum, curr) => sum.plus(curr.totalUsd), ZERO_VALUE) ?? ZERO_VALUE

    return totalV3Rewards.plus(totalV3Rebase).plus(totalV2Rewards).toNumber()
  }, [veRewardsV3, veTHEs, currentRewardsV2, prices.THE])

  const totalRewards = useMemo(
    () => farmedRewards ?? 0 + votingRewards ?? 0 + theNftRewards ?? 0,
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

  return (
    <Box className='flex h-full flex-col justify-between !p-4'>
      <NewTextSubHeading className='text-xl md:text-xl'>{t('Claimable Rewards')}</NewTextSubHeading>
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Paragraph
            style={{ width: `${percentage.farmed || 100}%` }}
            className={cn(
              'rounded-e-md px-1.5 py-2 text-neutral-50 lg:text-sm',
              percentage.farmed && 'bg-primary-400 text-primary-950',
            )}
          >
            {t('Farmed')}
          </Paragraph>
          <Paragraph className='text-neutral-50 lg:text-sm'>${formatAmount(farmedRewards)}</Paragraph>
        </div>

        <div className='flex items-center gap-2'>
          <Paragraph
            style={{ width: `${percentage.voting || 100}%` }}
            className={cn(
              'rounded-e-md px-1.5 py-2 text-neutral-50 lg:text-sm',
              percentage.voting && 'bg-primary-600 text-primary-950',
            )}
          >
            {t('Voting')}
          </Paragraph>
          <Paragraph className='text-neutral-50 lg:text-sm'>${formatAmount(votingRewards)}</Paragraph>
        </div>

        <div className='flex items-center gap-2'>
          <Paragraph
            style={{ width: `${percentage.theNft || 100}%` }}
            className={cn(
              'rounded-e-md px-1.5 py-2 text-neutral-50 lg:text-sm',
              percentage.theNft && 'bg-primary-800 text-primary-950',
            )}
          >
            {t('TheNFT')}
          </Paragraph>
          <Paragraph className='text-neutral-50 lg:text-sm'>${formatAmount(theNftRewards)}</Paragraph>
        </div>
      </div>

      {/* <Paragraph className='text-neutral-500'>
        {t('last 24 Hours')} <span className='text-primary-600'>+ ${formatAmount(32.48)}</span>
      </Paragraph> */}

      <NewTextHeading className='md:text-3xl'>
        {t('Total')} <span className='text-primary-300'>${formatAmount(totalRewards)}</span>
      </NewTextHeading>
      <EmphasisButton>{t('Claim')}</EmphasisButton>
    </Box>
  )
}

export default ClaimableRewards
