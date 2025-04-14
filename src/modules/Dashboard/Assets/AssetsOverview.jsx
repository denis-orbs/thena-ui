import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { NewTextHeading, TextHeading } from '@/components/typography'
import { useRewardPosition } from '@/hooks/useRewardPosition'
import { formatAmount, isInvalidAmount } from '@/lib/utils'

import LiquidityAPRChart from '../Chart/LiquidityAPRChart'

function AssetsOverview({ positionsValue }) {
  const t = useTranslations()
  const { totalProvided, totalRewards, totalPools } = useMemo(() => {
    const providedValue = positionsValue.reduce((sum, item) => sum + item.depositLiquidity, 0)
    const rewarsValue = positionsValue.reduce((sum, item) => sum + item.rewardUsd, 0)
    return { totalProvided: providedValue, totalRewards: rewarsValue, totalPools: positionsValue.length }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionsValue, positionsValue.length])

  const positionHaveRewards = useMemo(
    () => positionsValue.filter(pos => pos.rewardUsd > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positionsValue, totalRewards],
  )
  const { onClaimAllRewardPosition } = useRewardPosition()
  return (
    <div className='space-y-4'>
      <TextHeading className='font-archia max-md:hidden'>{t('Total Value Provided')}</TextHeading>
      <TextHeading className='font-archia text-xl font-semibold uppercase md:hidden'>
        {t('Provided Liquidity')}
      </TextHeading>
      <div className='grid grid-cols-1 md:grid-cols-2'>
        <div className='flex flex-col gap-8 max-md:text-center'>
          <TextHeading className='font-archia text-3xl font-semibold max-md:text-primary-300 md:text-4xl'>
            ${formatAmount(totalProvided)}{' '}
            <span className='font-semibold uppercase max-md:hidden'>{`${totalPools} ${t('Pools')}`}</span>
          </TextHeading>
          <TextHeading className='font-archia text-4xl font-semibold max-md:hidden'>
            {t('Generated Fees and Rewards')}
          </TextHeading>
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
          <LiquidityAPRChart data={positionsValue} className='h-[163px] w-[163px] md:h-[297px] md:w-[297px]' />
        </div>
      </div>
    </div>
  )
}

export default AssetsOverview
