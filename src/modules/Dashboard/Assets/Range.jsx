import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { TextSubHeading } from '@/components/typography'
import { cn, formatAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

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
        <div
          className={cn(
            'relative flex h-8 items-center justify-center overflow-hidden px-2 md:h-11',
            'rounded-md border border-warn-800 bg-warn-950 text-warn-700',
          )}
        >
          {t('Closed')}
        </div>
      ) : outOfRange ? (
        <div
          className={cn(
            'relative flex h-8 items-center justify-center gap-2 overflow-hidden px-2 py-1 text-base md:h-11',
            'rounded-md border border-warn-800 bg-warn-950 text-warn-700',
          )}
        >
          <InfoIcon className='size-5 stroke-warn-700' />
          <span>Out of Range</span>
        </div>
      ) : (
        <div className='relative flex h-8 items-center justify-center overflow-hidden rounded-md border border-neutral-600 px-2 md:h-11'>
          <div className='flex w-full justify-between'>
            <TextSubHeading className='text-base text-neutral-300'>
              {tickLowerPercent > 1e9
                ? '>1B'
                : `${tickLowerPercent < 0 ? '-' : ''} ${formatAmount(
                    tickLowerPercent < 0 ? tickLowerPercent * -1 : tickLowerPercent,
                    true,
                  )}%`}
            </TextSubHeading>
            <TextSubHeading className='text-base text-neutral-300'>
              {tickUpperPercent > 1e9
                ? '>1B'
                : `${tickUpperPercent < 0 ? '-' : ''} ${formatAmount(
                    tickUpperPercent < 0 ? tickUpperPercent * -1 : tickUpperPercent,
                    true,
                  )}%`}
            </TextSubHeading>
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

// background: bg-[linear-gradient(90deg, rgba(189, 96, 186, 0.1)_10.19%, rgba(189, 96, 186, 0.2)_50.11%, rgba(189, 96, 186, 0.1)_90.02%)];

export default Range
