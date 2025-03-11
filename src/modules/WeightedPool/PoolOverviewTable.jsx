import React, { useMemo } from 'react'

import { Paragraph } from '@/components/typography'
import { formatAmount } from '@/lib/utils'

function PoolOverviewTable({ tokens, colors }) {
  const data = useMemo(
    () =>
      tokens.map(token => ({
        amount: token.amount,
        weight: token.weight,
        symbol: token.symbol,
        valueUsd: Number(token.amount) * token.price,
      })),
    [tokens],
  )

  return (
    <div className='rounded-lg bg-transparent text-neutral-50'>
      <table className='w-full text-left'>
        <thead>
          <tr>
            <th className='py-2'>
              <Paragraph className='text-sm font-medium text-neutral-50 md:text-base lg:text-lg'>Token</Paragraph>
            </th>
            <th className='py-2'>
              <Paragraph className='text-sm font-medium text-neutral-50 md:text-base lg:text-lg'>
                <span className='hidden md:inline'>Pool</span> Weight
              </Paragraph>
            </th>
            <th className='py-2'>
              <Paragraph className='text-sm font-medium text-neutral-50 md:text-base lg:text-lg'>Value in $</Paragraph>
            </th>
            <th className='py-2'>
              <Paragraph className='text-sm font-medium text-neutral-50 md:text-base lg:text-lg'>
                <span>
                  <span className='hidden md:inline'>Token</span> Amount
                </span>
              </Paragraph>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td className='py-2'>
                <div className='flex items-center gap-2'>
                  <div className='h-3 w-3 rounded-full' style={{ backgroundColor: colors?.[index] }} />
                  <Paragraph className='text-sm md:text-base lg:text-lg'>{item.symbol}</Paragraph>
                </div>
              </td>
              <td className='py-2 text-sm md:text-base lg:text-lg'>{item.weight} %</td>
              <td className='py-2 text-sm md:text-base lg:text-lg'>$ {formatAmount(item.valueUsd)}</td>
              <td className='py-2 text-sm md:text-base lg:text-lg'>{`${formatAmount(item.amount)} ${item.symbol}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PoolOverviewTable
