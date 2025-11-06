'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, THE_LOGO } from '@/constant'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import usePrices from '@/hooks/usePrices'
import { useClaimBribes, useClaimBribesV2, useClaimRebase } from '@/hooks/useVeThe'
import InfoIcon from '@/icons/InfoIcon'
import { formatAmount } from '@/lib/utils'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'

import { NoRewards } from './NoRewards'

const sortOptions = [
  {
    label: 'ID',
    value: 'id',
    width: 'lg:w-[30%]',
    isDesc: true,
  },
  {
    label: 'Type of Reward',
    value: 'type',
    width: 'lg:w-[30%]',
    isDesc: true,
  },
  {
    label: 'Tokens',
    value: 'tokens',
    width: 'lg:flex-1',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'lg:w-fit',
    disabled: true,
  },
]

export default function CurrentRewards({ rewards, currentMutate, version = 3 }) {
  const t = useTranslations()

  const prices = usePrices()
  const { updateVeTHEs } = useVeTHEsContext()
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState({})

  const { onClaimBribes: onClaimBribesV3, pending: bribePendingV3 } = useClaimBribes()
  const { onClaimBribes: onClaimBribesV2, pending: bribePendingV2 } = useClaimBribesV2()
  const { onClaimRebase, pending: rebasePending } = useClaimRebase()

  const handleClaimBribe = useCallback(
    pool => {
      if (version === 3) onClaimBribesV3(pool, () => currentMutate())
      else onClaimBribesV2(pool, () => currentMutate())
    },
    [currentMutate, version, onClaimBribesV2, onClaimBribesV3],
  )

  const finalVeTHEs = useMemo(
    () =>
      rewards.map(pool => {
        const isVeTHE = pool && Number(pool.id) > 0

        // Rebase rewards
        if (isVeTHE) {
          return {
            id: (
              <div className='flex items-center gap-3'>
                <CircleImage className='h-7 w-7' src={THE_LOGO} alt='thena logo' />
                <TextHeading>veTHE #{pool.id}</TextHeading>
              </div>
            ),
            type: <Paragraph>{t('Rebase')}</Paragraph>,
            tokens: (
              <div className='flex items-center gap-1'>
                <Paragraph>${formatAmount(pool.rebase_amount.times(prices.THE))}</Paragraph>
                <InfoIcon data-tooltip-id={`vethe-${pool.id}`} />
                <CustomTooltip className='min-w-[136px]' id={`vethe-${pool.id}`}>
                  {formatAmount(pool.rebase_amount)} THE
                </CustomTooltip>
              </div>
            ),
            action: (
              <EmphasisButton
                className='w-full lg:w-fit'
                onClick={() => onClaimRebase(pool, () => updateVeTHEs())}
                disabled={rebasePending}
              >
                {t('Claim')}
              </EmphasisButton>
            ),
          }
        }

        // Incentive rewards
        return {
          id: (
            <>
              {pool.type !== PAIR_TYPES.WEIGHTED ? (
                <>
                  <IconGroup
                    className='*:not-fitst:-ml-2'
                    classNames={{
                      image: 'outline-2 w-7 h-7',
                    }}
                    logo1={pool.token0?.logoURI}
                    logo2={pool.token1?.logoURI}
                  />
                  <div className='flex flex-col'>
                    <TextHeading>{pool.symbol}</TextHeading>
                    <Paragraph className='text-sm'>{t(pool.type)}</Paragraph>
                  </div>
                </>
              ) : (
                <ListTokenPercantage listToken={pool.tokens} />
              )}
            </>
          ),
          type: <Paragraph>{`${t('Incentives')} + ${t('Fees')}`}</Paragraph>,
          tokens: (
            <div className='flex items-center gap-1'>
              <Paragraph>${formatAmount(pool.totalUsd)}</Paragraph>
              <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`projected-${pool.address}`} />
              <CustomTooltip className='min-w-[136px]' id={`projected-${pool.address}`}>
                <div className='flex flex-col gap-1'>
                  {pool.rewards &&
                    pool.rewards.map((reward, index) => (
                      <p key={`reward-${index}`}>{`${formatAmount(reward.amount, false, 5)} ${reward.symbol}`}</p>
                    ))}
                </div>
              </CustomTooltip>
            </div>
          ),
          action: (
            <EmphasisButton
              className='w-full lg:w-fit'
              onClick={() => handleClaimBribe(pool)}
              disabled={bribePendingV3 || bribePendingV2}
            >
              {t('Claim')}
            </EmphasisButton>
          ),
        }
      }),
    [
      bribePendingV2,
      bribePendingV3,
      handleClaimBribe,
      onClaimRebase,
      prices.THE,
      rebasePending,
      rewards,
      t,
      updateVeTHEs,
    ],
  )

  return rewards.length > 0 ? (
    <Table
      sortOptions={sortOptions}
      data={finalVeTHEs}
      sort={sort}
      setSort={setSort}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    />
  ) : (
    <NoRewards />
  )
}
