'use client'

import React, { useMemo, useState } from 'react'

import IconGroup from '@/components/icongroup'
import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
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
    label: 'Type of Reward',
    value: 'type',
    width: 'lg:w-[30%]',
    isDesc: true,
  },
  {
    label: 'Tokens',
    value: 'tokens',
    width: 'lg:w-fit',
    isDesc: true,
  },
]

export default function NextRewards({ rewards }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState({})

  const finalVeTHEs = useMemo(
    () =>
      rewards.map(pool => ({
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
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(rewards)],
  )

  return rewards.length > 0 ? (
    <Table
      sortOptions={sortOptions}
      data={finalVeTHEs}
      sort={sort}
      setSort={setSort}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      notAction
    />
  ) : (
    <NoRewards />
  )
}
