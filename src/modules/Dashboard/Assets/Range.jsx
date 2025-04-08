import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { TextSubHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'

function Range({ currentPrice, maxPrice, minPrice, liquidity }) {
  const t = useTranslations()
  const outOfRange = currentPrice ? currentPrice < minPrice || currentPrice >= maxPrice : false

  const currentPercent = useMemo(() => {
    if (currentPrice) {
      const range = maxPrice - minPrice
      const current = currentPrice - minPrice
      return (current / range) * 100
    }
    return 0
  }, [currentPrice, maxPrice, minPrice])

  const [tickLowerPercent, tickUpperPercent] = useMemo(() => {
    if (currentPrice) {
      return [((minPrice - currentPrice) / currentPrice) * 100, ((maxPrice - currentPrice) / currentPrice) * 100]
    }
    return [0, 0]
  }, [currentPrice, maxPrice, minPrice])

  return (
    <>
      {!Number(liquidity) ? (
        <div className='relative flex h-8 items-center justify-center overflow-hidden rounded-md bg-warn-600 px-2 text-warn-100 md:h-11'>
          {t('Closed')}
        </div>
      ) : outOfRange ? (
        <div className='relative flex h-8 items-center justify-center overflow-hidden rounded bg-yellow-800 px-2 py-1 text-xs text-yellow-400 md:h-11'>
          Out of Range
        </div>
      ) : (
        <div className='relative flex h-8 items-center justify-center overflow-hidden rounded-md border border-neutral-600 px-2 md:h-11'>
          <div className='flex w-full justify-between'>
            <TextSubHeading className='text-[10px]'>{formatAmount(tickLowerPercent)}%</TextSubHeading>
            <TextSubHeading className='text-[10px]'>{formatAmount(tickUpperPercent)}%</TextSubHeading>
          </div>

          <div
            style={{ left: `${currentPercent}%` }}
            className='pointer-events-none absolute top-0 flex h-full w-full -translate-x-1/2 transform items-center justify-center'
          >
            <div className='absolute h-full w-full bg-[linear-gradient(90deg,rgba(131,0,126,0)_31%,rgba(189,96,186,0.5)_52%,rgba(143,20,138,0)_75%)]' />
            <div className='z-10 h-[30px] w-[3px] rounded-md bg-primary-300 md:h-[42px]' />
          </div>
        </div>
      )}
    </>
  )
}

export default Range
