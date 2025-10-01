import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import { NewParagraph, NewTextHeading, Paragraph, TextHeading } from '@/components/typography'
import { ICHI_SINGLE_SIDED, PAIR_TYPES, ZERO_ADDRESS } from '@/constant'
import { useSimulateFarmReward } from '@/hooks/fusion/useAlgebra'
import usePrices from '@/hooks/usePrices'
import { useRewardPosition } from '@/hooks/useRewardPosition'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount, fromWei, isInvalidAmount, ZERO_VALUE } from '@/lib/utils'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
import { getStrategy } from '@/state/pools/hooks'
import { WarningTriangleYellowIcon } from '@/svgs'

import LiquidityAPRChart from '../Chart/LiquidityAPRChart'

function AssetsOverview({
  positions,
  removedClaimablePositions,
  currentHoverTableRow,
  isHoverFromChart,
  setIsHoverFromChart,
  setPositionRewards,
}) {
  const t = useTranslations()
  const { account } = useWallet()
  const { addReward, addFees } = useFarmRewards()
  const { onClaimAllRewardPosition } = useRewardPosition()

  const prices = usePrices()

  const filteredPositions = useMemo(
    () => positions.filter(pos => pos.version !== 2 || (pos.version === 2 && pos?.title === ICHI_SINGLE_SIDED)),
    [positions],
  )

  const manualFarmRewardAmount = useSimulateFarmReward(filteredPositions)

  const [v1FeesPositions, migratePositions] = useMemo(() => {
    const v1FeesPos = []
    const migratePos = []
    positions.forEach(pos => {
      const isV1Pool = [PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(pos.type)
      const isOldVersion = pos.version === 2
      if (isOldVersion && isV1Pool && !pos.staked) {
        v1FeesPos.push(pos)
      } else if (
        isOldVersion &&
        pos.title !== ICHI_SINGLE_SIDED &&
        ((isV1Pool && pos.staked) || Number(pos.fiatValueOfLiquidity) > 0 || Number(pos.liquidity) > 0)
      ) {
        migratePos.push(pos)
      }
    })
    return [v1FeesPos, migratePos]
  }, [positions])

  const [totalProvided, totalRewards, totalPools] = useMemo(() => {
    const providedValue = filteredPositions.reduce((sum, item) => sum + Number(item.fiatValueOfLiquidity), 0)

    // Reward from manualFarming has calculated from manualFarmRewardAmount
    const posWithoutManualFarming = filteredPositions.filter(pos => !(pos.type === 'Manual' && pos.isFarming === true))
    const rewardUsd = [...posWithoutManualFarming, ...removedClaimablePositions].reduce(
      (sum, item) => sum + item.rewardUsd,
      0,
    )

    const manualFarmingUsd = Number(manualFarmRewardAmount.times(prices.THE))
    const v1FeesUsd = v1FeesPositions.reduce((sum, item) => sum + Number(item.rewardUsd), 0)
    return [providedValue, rewardUsd + v1FeesUsd + manualFarmingUsd, filteredPositions.length]
  }, [filteredPositions, removedClaimablePositions, manualFarmRewardAmount, prices.THE, v1FeesPositions])

  const processManualPosition = useCallback(
    pos => {
      const isFarming = pos?.deployer === ZERO_ADDRESS
      if (isFarming) {
        const amount = fromWei(pos.farmRewardData?.[0] ?? 0n)
        if (amount.gt(0)) {
          addReward({
            amount,
            type: 'manual',
            args: [account, pos.key, pos.tokenId],
            key: getKeyFromTokenAddress('manual', [pos.tokenId, pos.asset0.address, pos.asset1.address]),
          })
        }
      } else if (pos.fees?.[0] > 0n || pos.fees?.[1] > 0n) {
        const [reward0, reward1] = pos.rewards
        addFees({
          amount: [reward0.amount, reward1.amount],
          symbol: pos.symbol,
          type: pos.version === 2 ? 'manualV2' : 'manualV3',
          args: [account, pos.tokenId, pos.version],
          key: getKeyFromTokenAddress('manual', [pos.tokenId, pos.asset0.address, pos.asset1.address]),
        })
      }
    },
    [account, addReward, addFees],
  )

  const processWeightedPosition = useCallback(
    pos => {
      const total = pos.claimableFee?.total ?? ZERO_VALUE
      if (pos.staked && total.gt(0)) {
        const farmReward = (pos.claimableFee?.tokenList ?? []).find(tk => tk.symbol === 'THE')
        addReward({
          amount: farmReward?.fee ?? 0,
          type: 'weighted',
          args: pos.gauge.address,
          key: getKeyFromTokenAddress(
            'weight',
            pos.tokens.map(tk => tk.address),
          ),
        })
      }
    },
    [addReward],
  )

  const processV1Position = useCallback(
    pos => {
      const feeAmounts = [pos.reward0, pos.reward1]
      const type = getStrategy(pos.title)

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
    },
    [addFees],
  )

  const processIchiSingleSidedPosition = useCallback(
    pos => {
      if (pos.rewardUsd > 0) {
        addReward({
          type: 'ichiSingleSided',
          symbol: pos.symbol,
          args: pos.gauge.address,
          amountInUsd: pos.account.earnedUsd,
          key: getKeyFromTokenAddress('ichi-single-sided', [pos.token0.address, pos.token1.address]),
        })
      }
    },
    [addReward],
  )

  const processV3Position = useCallback(
    pos => {
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
    },
    [addReward, addFees],
  )

  // Process all positions
  useEffect(() => {
    positions.forEach(pos => {
      if (pos.type === 'Manual') {
        processManualPosition(pos)
      } else if (pos.type === 'Weighted') {
        processWeightedPosition(pos)
      } else if ([PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(pos.title) && pos.version === 2) {
        processV1Position(pos)
      } else if (pos.title === ICHI_SINGLE_SIDED) {
        processIchiSingleSidedPosition(pos)
      } else if (pos.version === 3) {
        processV3Position(pos)
      }
    })
  }, [
    positions,
    processManualPosition,
    processWeightedPosition,
    processV1Position,
    processV3Position,
    processIchiSingleSidedPosition,
  ])

  useEffect(() => {
    removedClaimablePositions.forEach(pos => {
      const type = getStrategy(pos.title)
      addReward({
        type,
        args: pos.address,
        symbol: pos.symbol,
        amount: pos.account.gaugeEarned,
        version: pos.version,
        key: getKeyFromTokenAddress(type, [pos.token0.address, pos.token1.address]),
      })
    })
  }, [removedClaimablePositions, addReward])

  useEffect(() => {
    setPositionRewards(totalRewards)
  }, [setPositionRewards, totalRewards])

  const migrationMessageWarning = useMemo(
    () => (
      <div className='flex flex-col gap-2'>
        <TextHeading className='text-warn-100 text-xl font-medium'>{t('Migrate your Positions')}</TextHeading>
        <Paragraph className='text-warn-100 flex text-base'>{t('Migrate desc')}</Paragraph>
      </div>
    ),
    [t],
  )

  return (
    <div className='flex flex-col gap-6 md:px-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-2'>
        <div className='flex flex-col gap-4'>
          {filteredPositions.length > 0 && (
            <>
              <NewTextHeading className='text-xl md:text-[40px] md:leading-[48px]'>
                {t('Total Value Provided')}
              </NewTextHeading>
              <NewParagraph className='max-md:text-primary-300 flex gap-4 text-3xl max-md:text-center md:text-4xl'>
                <span>${formatAmount(totalProvided)}</span>
                <span className='font-semibold uppercase max-md:hidden'>{`${totalPools} ${t('Pools')}`}</span>
              </NewParagraph>
            </>
          )}
          <NewTextHeading className='font-semibold max-md:hidden md:text-3xl'>
            {t('Generated Fees and Rewards')}
          </NewTextHeading>
          <NewTextHeading className='text-primary-600 font-semibold max-md:hidden'>
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

        {filteredPositions.length > 0 && (
          <div className='flex h-full items-center justify-center'>
            <LiquidityAPRChart
              data={filteredPositions}
              currentHoverTableRow={currentHoverTableRow}
              className='h-[163px] w-[163px] md:h-[276px] md:w-[276px]'
              isHoverFromChart={isHoverFromChart}
              setIsHoverFromChart={setIsHoverFromChart}
            />
          </div>
        )}
      </div>

      {migratePositions.length > 0 && (
        <div className={cn('border-warn-900 bg-warn-950 flex items-center gap-4 rounded-lg border px-5 py-4')}>
          <div className='size-5 min-w-5 md:size-8 md:min-w-8'>
            <WarningTriangleYellowIcon className='size-full' />
          </div>
          {migrationMessageWarning}
        </div>
      )}
    </div>
  )
}

export default AssetsOverview
