import React, { useMemo } from 'react'

import { cn, formatAmount } from '@/lib/utils'

import IconGroup from '../icongroup'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { TextSubHeading } from '../typography'

function DoubleInput({ pair, balance, amount, onAmountChange, title, autoFocus = false }) {
  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => onAmountChange(balance.times(0.1).dp(18).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => onAmountChange(balance.times(0.25).dp(18).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => onAmountChange(balance.times(0.5).dp(18).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => onAmountChange(balance.dp(18).toString(10)),
      },
    ],
    [balance, onAmountChange],
  )

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <p className='font-medium text-white'>{title}</p>
        <Tabs data={percents} />
      </div>
      <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <input
            type='number'
            className='w-full border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
            placeholder='0.0'
            value={amount}
            onChange={e => {
              onAmountChange(Number(e.target.value) < 0 ? '' : e.target.value)
            }}
            min={0}
            autoFocus={autoFocus}
          />
          {pair ? (
            <div
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'rounded-full bg-neutral-600 text-sm text-neutral-200',
                'py-1.5 pl-1.5 pr-2',
              )}
            >
              <IconGroup
                className='-space-x-2'
                classNames={{
                  image: 'outline-2 w-6 h-6',
                }}
                logo1={pair.token0.logoURI}
                logo2={pair.token1.logoURI}
              />
              <span className='text-nowrap'>{pair.symbol}</span>
            </div>
          ) : (
            <Skeleton className='h-6 w-10' />
          )}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <TextSubHeading>${formatAmount(pair.lpPrice * amount)}</TextSubHeading>
          <TextSubHeading>Balance: {formatAmount(balance)}</TextSubHeading>
        </div>
      </div>
      {/* {errorMsg && (
        <Alert>
          <InfoIcon className='h-4 w-4 stroke-error-600' />
          <p>{errorMsg}</p>
        </Alert>
      )} */}
    </div>
  )
}

export default DoubleInput
