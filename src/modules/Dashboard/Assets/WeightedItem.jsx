import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import RemoveWeightedModal from '@/app/pools/RemoveWeightedModal'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CustomTooltip from '@/components/tooltip'
import { NewParagraph, NewTextSubHeading, TextHeading, TextSubHeading } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import usePrices from '@/hooks/usePrices'
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
import { InfoIcon } from '@/svgs'

function WeightedItem({ position, isStake }) {
  const t = useTranslations()
  const { push } = useRouter()
  const { isXlDown } = useMediaQuery()

  const [isOpenRemove, setIsOpenRemove] = useState(false)
  const [managePopup, setManagePopup] = useState(false)
  const [popupStake, setPopupStake] = useState(false)

  const prices = usePrices()
  const { onGaugeStake, pending: stakePending } = useGaugeStakeWeighted()
  const { onClaimFees, pending: pendingClaimFees } = useClaimWeightedPoolFees()
  const { onGaugeHarvest, pending: pendingHarvest } = useGaugeHarvestWeighted()
  const { gaugeBalance } = useGaugeBalance(position.gauge.address)
  const { onGaugeUnstake, pending: unstakePending } = useGaugeUnstakeWeighted(gaugeBalance)

  const { claimableFee, depositValue } = position

  const claimableFeeUSD = useMemo(() => {
    const amount = claimableFee?.total ?? ZERO_VALUE
    return amount.times(prices.THE).toNumber()
  }, [claimableFee, prices.THE])

  const onClaim = useCallback(
    async () =>
      await onClaimFees(position, () => {
        // mutatePosition()
      }),
    [onClaimFees, position],
  )

  const pairCell = useMemo(
    () => (
      <div className='flex w-full items-center gap-2'>
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
        <div className='flex justify-between max-xl:w-full max-xl:items-center xl:flex-col'>
          <NewTextSubHeading className='text-xl font-semibold md:text-xl'>{position.symbol}</NewTextSubHeading>
          <NewParagraph className='text-xl text-neutral-500 md:text-xl xl:text-xs xl:text-neutral-300'>
            Weighted
          </NewParagraph>
        </div>
      </div>
    ),
    [position.tokens, position.symbol],
  )

  const rangeCell = useMemo(() => <div className='w-full text-center'>{isStake ? 'Stake' : 'UnStake'}</div>, [isStake])

  const aprCell = useMemo(
    () => (
      <div className='flex flex-col'>
        <TextHeading>{position.apr}%</TextHeading>
        <TextSubHeading className=''>{t('APR')}</TextSubHeading>
      </div>
    ),
    [position.apr, t],
  )

  const valueCell = useMemo(
    () => (
      <div className='flex flex-col'>
        <TextHeading>${formatAmount(depositValue.depositUsd)}</TextHeading>
        <TextSubHeading className=''>{t('Value')}</TextSubHeading>
      </div>
    ),
    [depositValue.depositUsd, t],
  )

  const rewardsCell = useMemo(
    () => (
      <div className='flex flex-col'>
        <div className='flex items-center gap-2'>
          <span>${formatAmount(claimableFeeUSD)}</span>
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
    ),
    [claimableFeeUSD, position?.address, isStake, claimableFee?.tokenList, t],
  )

  const actionCell = useMemo(
    () => (
      <div className='grid w-full grid-cols-3 justify-center gap-2'>
        {isStake ? (
          <>
            <TextButton disabled={unstakePending} className='flex-1 px-1' onClick={() => setPopupStake(true)}>
              {t('Unstake')}
            </TextButton>

            <OutlinedButton
              className='flex-1 px-1'
              disabled={pendingHarvest || isInvalidAmount(claimableFee?.total)}
              onClick={() => onGaugeHarvest(position)}
            >
              {t('Harvest')}
            </OutlinedButton>

            <EmphasisButton
              className='flex-1 px-1'
              onClick={() => push(`/pools/add-liquidity/weighted/${position.address}`)}
            >
              {t('Add')}
            </EmphasisButton>
          </>
        ) : (
          <>
            <TextButton
              disabled={stakePending || position.gauge.address === zeroAddress}
              className='h-11 flex-1 px-1'
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
              className='h-11 flex-1 px-1'
            >
              {t('Claim')}
            </OutlinedButton>

            <EmphasisButton className='h-11 flex-1 px-1' onClick={() => setManagePopup(true)}>
              {t('Manage')}
            </EmphasisButton>
          </>
        )}
      </div>
    ),
    [
      claimableFee.total,
      isStake,
      onClaim,
      onGaugeHarvest,
      pendingClaimFees,
      pendingHarvest,
      position,
      push,
      stakePending,
      t,
      unstakePending,
    ],
  )

  return (
    <>
      {!isXlDown ? (
        <>
          <td>{pairCell}</td>
          <td>{rangeCell}</td>
          <td>{aprCell}</td>
          <td>{valueCell}</td>
          <td>{rewardsCell}</td>
          <td>{actionCell}</td>
        </>
      ) : (
        <div className='flex flex-col gap-4 py-4'>
          {pairCell}
          {rangeCell}
          <div className='flex w-full gap-2'>
            {aprCell}
            {valueCell}
            {rewardsCell}
          </div>
          {actionCell}
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
    </>
  )
}

export default WeightedItem
