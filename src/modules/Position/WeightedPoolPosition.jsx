import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import RemoveWeightedModal from '@/app/pools/RemoveWeightedModal'
import { GreenBadge, PrimaryBadge } from '@/components/badges/Badge'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import CustomTooltip from '@/components/tooltip'
import { UNKNOWN_LOGO } from '@/constant'
import {
  useClaimWeightedPoolFees,
  useGaugeBalance,
  useGaugeHarvestWeighted,
  useGaugeStakeWeighted,
  useGaugeUnstakeWeighted,
  usePositionData,
} from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, isInvalidAmount, ZERO_VALUE } from '@/lib/utils'
import { getKeyFromTokenAddress, useFarmRewards } from '@/state/farmReward/store'
import { InfoIcon } from '@/svgs'

import GaugeWeightedManageModal from './GaugeWeightedManageModal'
import ManageWeightedPositionModal from './ManageWeightedPositionModal'

export function WeightedPoolPosition({ pool, isStake }) {
  const t = useTranslations()
  const [isOpenRemove, setIsOpenRemove] = useState(false)
  const [managePopup, setManagePopup] = useState(false)
  const { onGaugeStake, pending: stakePending } = useGaugeStakeWeighted()
  const { gaugeBalance } = useGaugeBalance(pool.gauge.address)
  const { onGaugeUnstake, pending: unstakePending } = useGaugeUnstakeWeighted(gaugeBalance)
  const [popupStake, setPopupStake] = useState(false)

  const { push } = useRouter()

  const { onClaimFees, pending: pendingClaimFees } = useClaimWeightedPoolFees()

  const { claimableFee, depositValue, mutatePosition } = usePositionData(pool, isStake)

  const { onGaugeHarvest, pending: pendingHarvest } = useGaugeHarvestWeighted()

  const onClaim = useCallback(
    async () =>
      await onClaimFees(pool, () => {
        mutatePosition()
      }),
    [pool, onClaimFees, mutatePosition],
  )

  const weightsPrice = useMemo(() => {
    let totalWeight = 0

    const totalUsd = (depositValue?.tokens || []).reduce((sum, token) => sum + token.price * token.amount, 0)

    const weights = (depositValue?.tokens || []).map((token, index) => {
      const tokenUsd = token.price * token.amount
      if (index === depositValue.tokens.length - 1) return 100 - totalWeight
      const weight = (tokenUsd / totalUsd) * 100
      if (index < depositValue.tokens.length - 1) {
        totalWeight += weight
      }
      return weight
    })

    return weights
  }, [depositValue.tokens])

  const { addReward } = useFarmRewards()
  useEffect(() => {
    const amount = claimableFee?.total ?? ZERO_VALUE
    if (!isStake || amount.eq(0)) return

    addReward({
      amount,
      type: 'weighted',
      args: pool.gauge.address,
      key: getKeyFromTokenAddress(
        'weight',
        pool.tokens.map(tk => tk.address),
      ),
    })
  }, [addReward, claimableFee?.total, isStake, pool])

  return (
    <div className='flex h-full flex-col justify-between rounded-xl bg-neutral-900 p-4'>
      <div className='flex-1'>
        <div className='flex justify-between gap-2'>
          <div className='flex gap-2'>
            <ThreeIconGroup
              className='*:not-first:-ml-2'
              classNames={{
                image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
              }}
              logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
              logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
              extendNumber={(pool?.tokens?.length || 2) - 2}
            />
            <div className='flex flex-wrap items-center gap-2 lg:max-w-[90%]'>
              <div className='tems-center flex w-full flex-wrap gap-1'>
                {(pool?.tokens || []).map(token => (
                  <div className='flex items-center gap-1' key={token?.address}>
                    <span className='text-[16px] leading-5 font-medium'>{token?.symbol}</span>
                    <span className='text-sm leading-5 font-medium text-neutral-300'>
                      {formatAmount(token?.weight)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>{isStake ? <GreenBadge>{t('Staked')}</GreenBadge> : <PrimaryBadge>{t('Not Staked')}</PrimaryBadge>}</div>
        </div>

        <div className='mt-4 flex flex-col gap-y-4'>
          <div className='flex h-5 justify-between'>
            {isStake && (
              <>
                <span className='text-sm text-neutral-300'>{t('APR')}</span>
                <span>{pool.apr}</span>
              </>
            )}
          </div>

          <div className='flex justify-between'>
            <span className='text-sm text-neutral-300'>{t('Deposit Value in USD')}</span>
            <span>${formatAmount(depositValue.depositUsd)}</span>
          </div>

          {(depositValue?.tokens || []).map((token, index) => (
            <div className='flex justify-between' key={index}>
              <span className='text-sm text-neutral-300'>
                {token.name === 'Wrapped BNB' ? 'WBNB' : token.symbol} {t('Deposit')}
              </span>
              <span>
                <span>{formatAmount(token?.amount)}</span>
                <span className='text-sm text-neutral-500'>({formatAmount(weightsPrice[index])}%)</span>
              </span>
            </div>
          ))}

          <div className='flex justify-between'>
            <span className='text-sm text-neutral-300'>{t('Claimable Amount')}</span>
            <div className='flex items-center gap-2'>
              <span>${formatAmount(claimableFee?.total)}</span>
              <InfoIcon
                className='h-4 w-4 stroke-neutral-400'
                data-tooltip-id={`net-${pool?.address}-${isStake ? 'stake' : 'unstake'}`}
              />
              <CustomTooltip id={`net-${pool?.address}-${isStake ? 'stake' : 'unstake'}`}>
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
          </div>
        </div>
      </div>

      {isStake ? (
        <div className='mt-4 flex w-full gap-3'>
          <TextButton disabled={unstakePending} className='w-full' onClick={() => setPopupStake(true)}>
            {t('Unstake')}
          </TextButton>
          <OutlinedButton
            className='w-full'
            disabled={pendingHarvest || isInvalidAmount(claimableFee?.total)}
            onClick={() => onGaugeHarvest(pool)}
          >
            {t('Harvest')}
          </OutlinedButton>
          <EmphasisButton className='w-full' onClick={() => push(`/pools/add-liquidity/weighted/${pool.address}`)}>
            {t('Add')}
          </EmphasisButton>
        </div>
      ) : (
        <div className='mt-4 flex max-h-[46px]! w-full flex-2 gap-3'>
          <TextButton
            disabled={stakePending || pool.gauge.address === zeroAddress}
            className='h-11 w-full'
            onClick={() => setPopupStake(true)}
            data-tooltip-id={`stake-position-${pool.address}`}
          >
            {t('Stake')}
          </TextButton>
          {pool.gauge.address === zeroAddress && (
            <CustomTooltip id={`stake-position-${pool.address}`} className='max-w-[500px]'>
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

      <RemoveWeightedModal isOpen={isOpenRemove} pool={pool} setIsOpen={setIsOpenRemove} />
      <ManageWeightedPositionModal popup={managePopup} setPopup={setManagePopup} pool={pool} />
      <GaugeWeightedManageModal
        title={!isStake ? 'Stake LP' : 'Unstake LP'}
        onGaugeManage={!isStake ? onGaugeStake : onGaugeUnstake}
        pending={false}
        pool={pool}
        popup={popupStake}
        setPopup={setPopupStake}
        label={!isStake ? 'Stake' : 'Unstake'}
        isStake={isStake}
      />
    </div>
  )
}
