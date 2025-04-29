import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useClaimWeightedPoolFees, usePositionData } from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, isInvalidAmount, ZERO_VALUE } from '@/lib/utils'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
import { InfoIcon } from '@/svgs'

function WeightedItem({ position, isStake }) {
  const t = useTranslations()
  const { onClaimFees, pending: pendingClaimFees } = useClaimWeightedPoolFees()

  const { claimableFee, depositValue, mutatePosition } = usePositionData(position, isStake)

  // const { onGaugeHarvest, pending: pendingHarvest } = useGaugeHarvestWeighted()

  const onClaim = useCallback(
    async () =>
      await onClaimFees(position, () => {
        mutatePosition()
      }),
    [onClaimFees, position, mutatePosition],
  )

  const { addReward } = useFarmRewards()
  useEffect(() => {
    const amount = claimableFee?.total ?? ZERO_VALUE
    if (!isStake || amount.eq(0)) return

    addReward({
      amount,
      type: 'weighted',
      args: position.gauge.address,
      key: getKeyFromTokenAddress(
        'weight',
        position.tokens.map(tk => tk.address),
      ),
    })
  }, [addReward, claimableFee?.total, isStake, position])
  return (
    <div className='flex flex-col items-center justify-between gap-4 py-4 lg:flex-row lg:py-2'>
      <div className='flex w-full items-center gap-2 lg:w-[20%] lg:min-w-[195px]'>
        <GroupIconTokens
          classNames={{
            image: 'outline-2 w-7 h-7',
            rows: '-space-x-2',
            toolTip: 'hidden',
          }}
          width={32}
          height={32}
          tokens={position.tokens}
        />
        <div className='flex flex-row justify-between max-lg:w-full max-lg:items-center lg:flex-col'>
          <TextHeading>{position.symbol}</TextHeading>
          <Paragraph className='text-xl max-lg:font-archia max-lg:font-semibold lg:text-xs'>Weighted</Paragraph>
        </div>
      </div>
      <div className='w-full min-w-[146px] text-center lg:w-[17%]'>{isStake ? 'Stake' : 'UnStake'}</div>
      <div className='flex w-full gap-4 lg:w-[39%]'>
        <div className='flex w-1/3 flex-col'>
          <TextHeading>{position.apr}</TextHeading>
          <TextSubHeading className=''>{t('APR')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 flex-col'>
          <TextHeading>${formatAmount(depositValue.depositUsd)}</TextHeading>
          <TextSubHeading className=''>{t('Value')}</TextSubHeading>
        </div>
        <div className='flex w-1/3 flex-col'>
          <div className='flex items-center gap-2'>
            <span>${formatAmount(claimableFee?.total)}</span>
            <InfoIcon
              className='h-4 w-4 stroke-neutral-400'
              data-tooltip-id={`net-${position?.address}-${isStake ? 'stake' : 'unstake'}`}
            />
            <CustomTooltip id={`net-${position?.address}-${isStake ? 'stake' : 'unstake'}`}>
              {(claimableFee?.tokenList || []).every(item => isInvalidAmount(item?.fee)) ? (
                <>
                  {(claimableFee?.tokenList || []).map((reward, index) => (
                    <p key={`${reward.address}-${index}`}>
                      {`${formatAmount(reward?.fee)} ${
                        reward?.name === 'Wrapped BNB' ? 'WBNB' : reward?.symbol || 'UNKNOWN'
                      }`}
                    </p>
                  ))}
                </>
              ) : (
                <>
                  {(claimableFee?.tokenList || []).map((reward, index) => (
                    <p key={`${reward.address}-${index}`}>
                      {!isInvalidAmount(reward?.fee) &&
                        `${formatAmount(reward?.fee)} ${
                          reward?.name === 'Wrapped BNB' ? 'WBNB' : reward?.symbol || 'UNKNOWN'
                        }`}
                    </p>
                  ))}
                </>
              )}
            </CustomTooltip>
          </div>
          <TextSubHeading className=''>{t('Reward')}</TextSubHeading>
        </div>
      </div>
      <div className='flex w-full justify-center gap-2 lg:w-[24%] lg:max-w-[269px]'>
        <EmphasisButton
          className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'
          disabled={pendingClaimFees || isInvalidAmount(claimableFee.total)}
          onClick={onClaim}
        >
          {t('Claim')}
        </EmphasisButton>
        <EmphasisButton className='h-8 w-full flex-1 text-xs md:h-11 md:text-base'>{t('Manage')}</EmphasisButton>
      </div>
    </div>
  )
}

export default WeightedItem
