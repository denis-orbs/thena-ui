import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { NewParagraph, NewTextHeading } from '@/components/typography'
import { ZERO_ADDRESS } from '@/constant'
import { useRewardPosition } from '@/hooks/useRewardPosition'
import useWallet from '@/hooks/useWallet'
import { formatAmount, fromWei, isInvalidAmount, ZERO_VALUE } from '@/lib/utils'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
import { getStrategy } from '@/state/pools/hooks'

import LiquidityAPRChart from '../Chart/LiquidityAPRChart'

function AssetsOverview({ positions }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { addReward, addFees } = useFarmRewards()
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

  useEffect(() => {
    positions.forEach(pos => {
      if (pos.type === 'Manual') {
        const isFarming = pos?.deployer !== ZERO_ADDRESS
        if (isFarming) {
          const amount = fromWei(pos.farmRewardData?.[0] ?? 0n)
          if (amount.gt(0)) {
            addReward({
              amount,
              type: 'manual',
              args: [account, pos.key, pos.tokenId],
              key: getKeyFromTokenAddress('manual', [pos.asset0.address, pos.asset1.address]),
            })
          }
        } else {
          addFees({
            amount: pos.rewards,
            type: 'manual',
            args: [account, pos.key, pos.tokenId],
            key: getKeyFromTokenAddress('manual', [pos.asset0.address, pos.asset1.address]),
          })
        }
      } else if (pos.type === 'Weighted') {
        const amount = pos.claimableFee?.total ?? ZERO_VALUE
        if (pos.staked && amount.gt(0)) {
          addReward({
            amount,
            type: 'weighted',
            args: pos.gauge.address,
            key: getKeyFromTokenAddress(
              'weight',
              pos.tokens.map(tk => tk.address),
            ),
          })
        }
      } else if (pos && pos.version === 3) {
        const type = getStrategy(pos.title)
        let args = null
        let amount = ZERO_VALUE
        let feeAmounts = [ZERO_VALUE, ZERO_VALUE]

        if (type === 'classic' || type === 'stable') {
          args = pos.gauge.address
          amount = pos.account.gaugeEarned
          feeAmounts = [pos.account.token0Claimable, pos.account.token1Claimable]
        } else if (type === 'gamma' || type === 'ichi') {
          args = pos.address
          amount = pos.account.gaugeEarned
        }

        if (amount.gt(0)) {
          addReward({
            type,
            args,
            amount,
            version: pos.version,
            key: getKeyFromTokenAddress(type, [pos.token0.address, pos.token1.address]),
          })
        }

        if (feeAmounts[0]?.gt(0) || feeAmounts[1]?.gt(0)) {
          addFees({
            type,
            args,
            amount: feeAmounts,
            version: pos.version,
            key: getKeyFromTokenAddress(type, [pos.token0.address, pos.token1.address]),
          })
        }
      }
    })
  }, [account, addReward, addFees, positions])

  return (
    <div className='space-y-4'>
      <NewTextHeading className='text-xl md:text-[40px] md:leading-[48px]'>{t('Total Value Provided')}</NewTextHeading>
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
