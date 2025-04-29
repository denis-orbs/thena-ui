import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'
import { zeroAddress } from 'viem'

import RemoveWeightedModal from '@/app/pools/RemoveWeightedModal'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import {
  useClaimWeightedPoolFees,
  useGaugeBalance,
  useGaugeHarvestWeighted,
  useGaugeStakeWeighted,
  useGaugeUnstakeWeighted,
} from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, isInvalidAmount, ZERO_VALUE } from '@/lib/utils'
import GaugeWeightedManageModal from '@/modules/Position/GaugeWeightedManageModal'
import ManageWeightedPositionModal from '@/modules/Position/ManageWeightedPositionModal'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
import { InfoIcon } from '@/svgs'

function WeightedItem({ position, isStake }) {
  const t = useTranslations()
  const [isOpenRemove, setIsOpenRemove] = useState(false)
  const [managePopup, setManagePopup] = useState(false)
  const { onGaugeStake, pending: stakePending } = useGaugeStakeWeighted()
  const { gaugeBalance } = useGaugeBalance(position.gauge.address)
  const { onGaugeUnstake, pending: unstakePending } = useGaugeUnstakeWeighted(gaugeBalance)
  const [popupStake, setPopupStake] = useState(false)

  const { push } = useRouter()

  const { onClaimFees, pending: pendingClaimFees } = useClaimWeightedPoolFees()

  const { claimableFee, depositValue } = position

  const { onGaugeHarvest, pending: pendingHarvest } = useGaugeHarvestWeighted()

  const onClaim = useCallback(
    async () =>
      await onClaimFees(position, () => {
        // mutatePosition()
      }),
    [onClaimFees, position],
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
          <NewTextSubHeading className='text-xl font-semibold md:text-xl'>{position.symbol}</NewTextSubHeading>
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

      {isStake ? (
        <div className='flex w-full justify-center gap-2 lg:w-[24%] lg:max-w-[269px]'>
          <TextButton disabled={unstakePending} className='w-full' onClick={() => setPopupStake(true)}>
            {t('Unstake')}
          </TextButton>
          <OutlinedButton
            className='w-full'
            disabled={pendingHarvest || isInvalidAmount(claimableFee?.total)}
            onClick={() => onGaugeHarvest(position)}
          >
            {t('Harvest')}
          </OutlinedButton>
          <EmphasisButton className='w-full' onClick={() => push(`/pools/add-liquidity/weighted/${position.address}`)}>
            {t('Add')}
          </EmphasisButton>
        </div>
      ) : (
        <div className='flex w-full justify-center gap-2 lg:w-[24%] lg:max-w-[269px]'>
          <TextButton
            disabled={stakePending || position.gauge.address === zeroAddress}
            className='h-11 w-full'
            onClick={() => setPopupStake(true)}
            data-tooltip-id={`stake-position-${position.address}`}
          >
            {t('Stake')}
          </TextButton>
          {position.gauge.address === zeroAddress && (
            <CustomTooltip id={`stake-position-${position.address}`} className='max-w-[500px]'>
              {t('This pool has no Gauge')}
            </CustomTooltip>
          )}

          <OutlinedButton
            disabled={pendingClaimFees || isInvalidAmount(claimableFee.total)}
            onClick={onClaim}
            className='h-11 w-full'
          >
            {t('Claim')}
          </OutlinedButton>

          <EmphasisButton className='h-11 w-full' onClick={() => setManagePopup(true)}>
            {t('Manage')}
          </EmphasisButton>
        </div>
      )}

      <RemoveWeightedModal isOpen={isOpenRemove} pool={position} setIsOpen={setIsOpenRemove} />
      <ManageWeightedPositionModal popup={managePopup} setPopup={setManagePopup} pool={position} />
      <GaugeWeightedManageModal
        title={!isStake ? 'Stake LP' : 'Unstake LP'}
        onGaugeManage={!isStake ? onGaugeStake : onGaugeUnstake}
        pending={false}
        pool={position}
        popup={popupStake}
        setPopup={setPopupStake}
        label={!isStake ? 'Stake' : 'Unstake'}
        isStake={isStake}
      />
    </div>
  )
}

export default WeightedItem
