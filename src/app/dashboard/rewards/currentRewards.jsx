'use client'

import React, { useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import usePrices from '@/hooks/usePrices'
import { useClaimBribes, useClaimRebase } from '@/hooks/useVeThe'
import { formatAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import { NoRewards } from './NoRewards'

const sortOptions = [
  {
    label: 'ID',
    value: 'id',
    width: 'lg:w-[30%]',
    isDesc: true,
  },
  {
    label: 'Type of reward',
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

export default function CurrentRewards({ rewards, currentMutate }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState({})
  const prices = usePrices()
  const { onClaimBribes, pending: bribePending } = useClaimBribes()
  const { onClaimRebase, pending: rebasePending } = useClaimRebase()
  const { updateVeTHEs } = useVeTHEsContext()

  const finalVeTHEs = useMemo(
    () =>
      rewards.map(pool => {
        const isVeTHE = pool && Number(pool.id) > 0
        if (isVeTHE) {
          return {
            id: (
              <div className='flex items-center gap-3'>
                <CircleImage className='h-7 w-7' src='https://cdn.thena.fi/assets/THE.png' alt='thena logo' />
                <TextHeading>veTHE #{pool.id}</TextHeading>
              </div>
            ),
            type: <Paragraph>Rebase</Paragraph>,
            tokens: (
              <div className='flex items-center gap-1'>
                <Paragraph>${formatAmount(pool.rebase_amount.times(prices.THE))}</Paragraph>
                <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`vethe-${pool.id}`} />
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
                Claim
              </EmphasisButton>
            ),
          }
        }
        return {
          id: (
            <div className='flex items-center gap-3'>
              <IconGroup
                className='-space-x-2'
                classNames={{
                  image: 'outline-2 w-7 h-7',
                }}
                logo1={pool.token0.logoURI}
                logo2={pool.token1.logoURI}
              />
              <div className='flex flex-col'>
                <TextHeading>{pool.symbol}</TextHeading>
                <Paragraph className='text-sm'>{pool.title}</Paragraph>
              </div>
            </div>
          ),
          type: <Paragraph>Bribes + Fees</Paragraph>,
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
              onClick={() => onClaimBribes(pool, () => currentMutate())}
              disabled={bribePending}
            >
              Claim
            </EmphasisButton>
          ),
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(rewards), prices.THE],
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
