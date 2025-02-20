import React, { useMemo } from 'react'

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
            <th className='py-2'>Token</th>
            <th className='py-2'>Pool Weight</th>
            <th className='py-2'>Value in $</th>
            <th className='py-2'>Token Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td className='flex items-center gap-2 py-2'>
                <span className='h-3 w-3 rounded-full' style={{ backgroundColor: colors?.[index] }} />
                {item.symbol}
              </td>
              <td className='py-2'>{item.weight} %</td>
              <td className='py-2'>$ {formatAmount(item.valueUsd)}</td>
              <td className='py-2'>{`${formatAmount(item.amount)} ${item.symbol}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PoolOverviewTable
