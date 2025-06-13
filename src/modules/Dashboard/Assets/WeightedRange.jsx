import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { formatAmount } from '@/lib/utils'
import { PolygonSmallIcon } from '@/svgs'

function WeightedRange({ weighted }) {
  const t = useTranslations()
  const [hoveredToken, setHoveredToken] = useState(null)

  console.log({ weighted })

  const tokensData = useMemo(() => {
    // Use mock data if weighted is not provided or doesn't have tokens
    const tokens = weighted?.tokens
    return tokens.map(token => ({
      ...token,
      amount: token.balance || token.amount,
    }))
  }, [weighted])

  return (
    <div className='flex h-[54px] items-center justify-center'>
      {/* Weighted Range Bar */}
      <div className='relative flex h-5 w-full overflow-visible rounded-md border border-neutral-600'>
        {tokensData.map((token, index) => (
          <div
            key={token.address}
            className='bg-full-range relative flex h-full cursor-pointer items-center justify-center font-medium text-white transition-all duration-200 hover:brightness-110'
            style={{
              width: `${token.weight}%`,
            }}
            onMouseEnter={() => setHoveredToken(token)}
            onMouseLeave={() => setHoveredToken(null)}
          >
            {hoveredToken === token && (
              <div className='absolute -top-5 left-0 transform text-[10px] leading-4 text-neutral-50'>
                {token.weight}% {token.symbol}
              </div>
            )}
            <div className='pointer-events-none flex h-full items-center justify-center'>
              <span className='text-[10px] leading-4 text-neutral-50'>
                {tokensData.length < 3 ? token.weight : index + 1}
              </span>
            </div>
            {index < tokensData.length - 1 && (
              <PolygonSmallIcon className='absolute top-1/2 -right-0.5 z-10 h-8 w-1.5 -translate-y-1/2 transform text-neutral-600' />
            )}

            {hoveredToken === token && (
              <div className='absolute top-5 left-0 transform text-[10px] leading-4 text-nowrap text-neutral-50'>
                {`${t('Your Position Amount')}: ${formatAmount(token.amount)} ${token.symbol}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WeightedRange
