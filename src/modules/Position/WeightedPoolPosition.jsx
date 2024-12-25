import { useTranslations } from 'next-intl'
import { useState } from 'react'

import AddLiquidityWeightedModal from '@/app/pools/AddLiquidityWeightedModal'
import RemoveWeightedModal from '@/app/pools/RemoveWeightedModal'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import CustomTooltip from '@/components/tooltip'
import { UNKNOWN_LOGO } from '@/constant'
import { useClaimWeightedPoolFees, usePositionData } from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, isInvalidAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

export function WeightedPoolPosition({ pool }) {
  const t = useTranslations()
  const [isOpenRemove, setIsOpenRemove] = useState(false)
  const [isOpenAdd, setIsOpenAdd] = useState(false)

  const { onClaimFees, pending: pendingClaimFees } = useClaimWeightedPoolFees()

  const { claimableFee, depositValue, mutatePosition } = usePositionData(pool)

  return (
    <div className='flex h-full flex-col justify-between rounded-xl bg-neutral-900 p-4'>
      <div className='flex-1'>
        <div className='flex space-x-4'>
          <ThreeIconGroup
            className='-space-x-2'
            classNames={{
              image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
            }}
            logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
            logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
            extendNumber={(pool?.tokens?.length || 2) - 2}
          />
          <div className='flex items-center gap-2 lg:max-w-[90%]'>
            <div className='flex w-full flex-wrap items-center gap-1 '>
              {(pool?.tokens || []).map(token => (
                <div className='flex items-center gap-1' key={token?.address}>
                  <span className='text-[16px] font-medium leading-5'>{token?.symbol}</span>
                  <span className='text-sm font-medium leading-5 text-neutral-300 '>
                    {formatAmount(token?.weight)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='mt-4 flex flex-col gap-y-4'>
          <div className='flex justify-between'>
            <span className='text-sm text-neutral-300'>{t('APR')}</span>
            <span>{pool.apr}</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-sm text-neutral-300'>{t('Deposit Value in USD')}</span>
            <span>${formatAmount(depositValue.depositUsd)}</span>
          </div>

          {(depositValue?.tokens || []).map((token, index) => (
            <div className='flex justify-between' key={index}>
              <span className='text-sm text-neutral-300'>
                {token.symbol} {t('Deposit')}
              </span>
              <span>
                <span>{formatAmount(token?.amount)}</span>
                <span className='text-sm text-neutral-500'>({formatAmount(token?.weight)}%)</span>
              </span>
            </div>
          ))}

          <div className='flex justify-between'>
            <span className='text-sm text-neutral-300'>{t('Claimable Fees')}</span>
            <p className='flex items-center gap-2'>
              <span>${formatAmount(claimableFee.total)}</span>
              <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`net-${pool?.address}`} />
            </p>
          </div>
        </div>

        <CustomTooltip id={`net-${pool?.address}`}>
          {claimableFee.tokenList.map(token => (
            <p key={token.symbol}>{`${formatAmount(token.fee)} ${token.symbol}`}</p>
          ))}
        </CustomTooltip>
      </div>

      <div className='mt-4 flex !max-h-[46px] w-full flex-2 gap-3'>
        <TextButton
          className='h-11 w-full'
          disabled={pendingClaimFees || isInvalidAmount(claimableFee.total)}
          onClick={() => {
            onClaimFees(pool, () => {
              mutatePosition()
            })
          }}
        >
          {t('Claim')}
        </TextButton>

        <OutlinedButton onClick={() => setIsOpenRemove(true)} className='h-11 w-full'>
          {t('Remove')}
        </OutlinedButton>

        <EmphasisButton className='h-11 w-full' onClick={() => setIsOpenAdd(true)}>
          {t('Add')}
        </EmphasisButton>
      </div>
      <RemoveWeightedModal isOpen={isOpenRemove} pool={pool} setIsOpen={setIsOpenRemove} />
      <AddLiquidityWeightedModal isOpen={isOpenAdd} pool={pool} setIsOpen={setIsOpenAdd} />
    </div>
  )
}
