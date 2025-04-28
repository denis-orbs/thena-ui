import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { NewParagraph, NewTextHeading } from '@/components/typography'
import { useRewardPosition } from '@/hooks/useRewardPosition'
import { formatAmount, isInvalidAmount } from '@/lib/utils'

import LiquidityAPRChart from '../Chart/LiquidityAPRChart'

function AssetsOverview({ positions }) {
  const t = useTranslations()
  const { onClaimAllRewardPosition } = useRewardPosition()

  const filterVersion = useMemo(() => positions.filter(pos => pos.version !== 2), [positions])

  const { totalProvided, totalRewards, totalPools } = useMemo(() => {
    const providedValue = filterVersion.reduce((sum, item) => sum + Number(item.fiatValueOfLiquidity), 0)
    const rewardsValue = filterVersion.reduce((sum, item) => sum + item.rewardUsd, 0)
    return { totalProvided: providedValue, totalRewards: rewardsValue, totalPools: filterVersion.length }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterVersion, filterVersion.length])

  const positionHaveRewards = useMemo(
    () => filterVersion.filter(pos => pos.rewardUsd > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterVersion, totalRewards],
  )

  return (
    <div className='space-y-4'>
      <NewTextHeading className='text-xl md:text-[40px]'>{t('Total Value Provided')}</NewTextHeading>
      <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
        <div className='flex flex-col gap-8 max-md:text-center'>
          <NewParagraph className='space-x-4 text-3xl max-md:text-primary-300 md:text-xl'>
            <span>${formatAmount(totalProvided)}</span>
            <span className='font-semibold uppercase max-md:hidden'>{`${totalPools} ${t('Pools')}`}</span>
          </NewParagraph>
          <NewTextHeading className='font-semibold max-md:hidden md:text-xl'>
            {t('Generated Fees and Rewards')}
          </NewTextHeading>
          <NewTextHeading className='font-semibold text-primary-600 max-md:hidden'>
            ${formatAmount(totalRewards)}
          </NewTextHeading>
          <PrimaryButton
            disabled={isInvalidAmount(totalRewards)}
            className='w-fit max-md:hidden'
            onClick={() => onClaimAllRewardPosition(positionHaveRewards)}
          >
            {t('Claim All Rewards')}
          </PrimaryButton>
        </div>
        <div className='flex h-full items-center justify-center'>
          <LiquidityAPRChart data={filterVersion} className='h-[163px] w-[163px] md:h-[297px] md:w-[297px]' />
        </div>
      </div>
    </div>
  )
}

export default AssetsOverview
