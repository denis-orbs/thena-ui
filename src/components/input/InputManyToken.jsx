import { useTranslations } from 'next-intl'
import React, { useId, useMemo } from 'react'

import { useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import cn from '@/utils/classes'
import { formatAddress, formatAmount } from '@/utils/utils'

import { ThreeIconGroup } from '../icongroup/ThreeIconGroup'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import CustomTooltip from '../tooltip'
import { TextSubHeading } from '../typography'

function InputManyToken({ pair, amount, onAmountChange, title, autoFocus = false, readOnly = false, balanceValue }) {
  const toolTipId = useId()

  const { balance: weightedBalance, decimals, pending } = useWeightPoolData(pair.address)

  const balance = useMemo(() => balanceValue ?? weightedBalance, [balanceValue, weightedBalance])

  const t = useTranslations()
  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => {
          onAmountChange(balance.times(0.1).dp(decimals).toString(10))
        },
      },
      {
        label: '25%',
        onClickHandler: () => onAmountChange(balance.times(0.25).dp(decimals).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => onAmountChange(balance.times(0.5).dp(decimals).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => onAmountChange(balance.dp(decimals).toString(10)),
      },
    ],
    [balance, decimals, onAmountChange],
  )

  return (
    <div className='flex w-full flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <p className='font-medium text-white'>{t(title)}</p>
        {!readOnly && <Tabs data={percents} />}
      </div>
      {pending ? (
        <Skeleton className='h-6 w-full' />
      ) : (
        <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <input
              type='number'
              className='w-full flex-4 border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
              placeholder='0.0'
              value={amount}
              onChange={e => {
                onAmountChange(Number(e.target.value) < 0 ? '' : e.target.value)
              }}
              min={0}
              autoFocus={autoFocus}
              readOnly={readOnly}
            />
            {pair ? (
              <div
                className={cn(
                  'inline-flex items-center justify-center gap-2',
                  'rounded-full bg-neutral-600 text-sm text-neutral-200',
                  'max-w-[60%] py-1.5 pr-2 pl-1.5',
                )}
              >
                <ThreeIconGroup
                  logo1={pair?.tokens?.[0]?.logoURI}
                  logo2={pair?.tokens?.[1]?.logoURI}
                  extendNumber={(pair?.tokens?.length || 2) - 2}
                  classNames={{ image: 'w-6 h-6' }}
                  className='*:not-first:-ml-1'
                />
                <span className='text-wrap' data-tooltip-id={toolTipId}>
                  {pair?.symbol?.length > 10 ? formatAddress(pair?.symbol) : pair?.symbol}
                </span>
                {pair?.symbol?.length > 10 && (
                  <CustomTooltip id={toolTipId} className='max-w-[500px]'>
                    {pair?.symbol}
                  </CustomTooltip>
                )}
              </div>
            ) : (
              <Skeleton className='h-6 w-10' />
            )}
          </div>
          <div className='flex items-center justify-between gap-2'>
            <TextSubHeading>${formatAmount(pair.lpPrice * amount)}</TextSubHeading>
            <TextSubHeading className='flex items-center'>
              {t('Balance')}: {!pending ? <>{formatAmount(balance)}</> : <Skeleton className='h-6 w-10' />}
            </TextSubHeading>
          </div>
        </div>
      )}
    </div>
  )
}

export default InputManyToken
