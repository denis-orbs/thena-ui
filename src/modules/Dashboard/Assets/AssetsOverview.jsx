import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { NewParagraph, NewTextHeading, Paragraph, TextHeading } from '@/components/typography'
import { ZERO_ADDRESS } from '@/constant'
import { useRewardPosition } from '@/hooks/useRewardPosition'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount, fromWei, isInvalidAmount, ZERO_VALUE } from '@/lib/utils'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
import { getStrategy } from '@/state/pools/hooks'
import { WarningTriangleIcon } from '@/svgs'

import LiquidityAPRChart from '../Chart/LiquidityAPRChart'

function AssetsOverview({ positions }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { addReward, addFees } = useFarmRewards()
  const { onClaimAllRewardPosition } = useRewardPosition()

  const positionsV2 = useMemo(() => positions.filter(pos => pos.version === 2), [positions])
  const filteredPositions = useMemo(() => positions.filter(pos => pos.version !== 2), [positions])

  const [totalProvided, totalRewards, totalPools] = useMemo(() => {
    const providedValue = filteredPositions.reduce((sum, item) => sum + Number(item.fiatValueOfLiquidity), 0)
    const rewardUsd = filteredPositions.reduce((sum, item) => sum + item.rewardUsd, 0)
    return [providedValue, rewardUsd, filteredPositions.length]
  }, [filteredPositions])

  useEffect(() => {
    positions.forEach(pos => {
      if (pos.type === 'Manual') {
        const isFarming = pos?.deployer === ZERO_ADDRESS
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
        } else if (pos.fees?.[0] > 0n || pos.fees?.[1] > 0n) {
          const [reward0, reward1] = pos.rewards
          addFees({
            amount: [reward0.amount, reward1.amount],
            symbol: pos.symbol,
            type: 'manual',
            args: [account, pos.tokenId, pos.version],
            key: getKeyFromTokenAddress('manual', [pos.tokenId, pos.asset0.address, pos.asset1.address]),
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
      } else if (pos.version === 3) {
        const type = getStrategy(pos.title)
        let args = null
        let amount = ZERO_VALUE
        let feeAmounts = [ZERO_VALUE, ZERO_VALUE]

        if (type === 'classic' || type === 'stable') {
          args = pos.gauge.address
          amount = pos.account.gaugeEarned
          feeAmounts = [pos.reward0, pos.reward1]
        } else if (type === 'gamma' || type === 'ichi') {
          args = pos.address
          amount = pos.account.gaugeEarned
        }

        if (amount.gt(0)) {
          addReward({
            type,
            args,
            symbol: pos.symbol,
            amount,
            version: pos.version,
            key: getKeyFromTokenAddress(type, [pos.token0.address, pos.token1.address]),
          })
        }

        if (feeAmounts[0]?.gt(0) || feeAmounts[1]?.gt(0)) {
          addFees({
            type,
            args: pos.address,
            symbol: pos.symbol,
            amount: feeAmounts,
            version: pos.version,
            key: getKeyFromTokenAddress(type, [pos.token0.address, pos.token1.address]),
          })
        }
      }
    })
  }, [account, addReward, addFees, positions])

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
        <div className='flex flex-col gap-4'>
          <NewTextHeading className='text-xl md:text-[40px] md:leading-[48px]'>
            {t('Total Value Provided')}
          </NewTextHeading>
          <NewParagraph className='space-x-4 text-4xl max-md:text-primary-300 md:text-4xl'>
            <span>${formatAmount(totalProvided)}</span>
            <span className='font-semibold uppercase max-md:hidden'>{`${totalPools} ${t('Pools')}`}</span>
          </NewParagraph>
          <NewTextHeading className='font-semibold max-md:hidden md:text-3xl'>
            {t('Generated Fees and Rewards')}
          </NewTextHeading>
          <NewTextHeading className='font-semibold text-primary-600 max-md:hidden'>
            ${formatAmount(totalRewards)}
          </NewTextHeading>
          <PrimaryButton
            disabled={isInvalidAmount(totalRewards)}
            className='w-fit max-md:hidden'
            onClick={() => onClaimAllRewardPosition()}
          >
            {t('Claim All Rewards')}
          </PrimaryButton>
        </div>

        <div className='flex h-full items-center justify-center'>
          <LiquidityAPRChart data={filteredPositions} className='h-[163px] w-[163px] md:h-[297px] md:w-[297px]' />
        </div>
      </div>

      {positionsV2.length > 0 && (
        <div className={cn('flex items-center gap-4 rounded-lg border border-error-800 bg-error-950 p-4 md:p-8')}>
          <div className='size-5 min-w-5 md:size-8 md:min-w-8'>
            <WarningTriangleIcon className='size-full' />
          </div>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-xl font-medium text-error-100'>{t('Migrate your Positions')}</TextHeading>
            <Paragraph className='flex flex-col text-base text-error-100'>
              <span>{t('Migrate desc 1')}</span>
              <span>{t('Migrate desc 2')}</span>
            </Paragraph>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetsOverview
