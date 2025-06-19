import { useState } from 'react'

import { cn, formatAmount } from '@/lib/utils'
import { PolygonSmallIcon } from '@/svgs'

function WeightedRange({ weighted }) {
  const [hoveredToken, setHoveredToken] = useState(null)
  const { depositValue } = weighted
  return (
    <div className='flex h-[54px] items-center justify-center'>
      {/* Weighted Range Bar */}
      <div className='relative flex h-5 w-full overflow-visible rounded-md border border-neutral-600'>
        {(depositValue?.tokens || []).map((token, index) => {
          const totalTokens = depositValue?.tokens || []

          return (
            <div
              key={token.address}
              className={cn(
                'bg-full-range bg-full-range-weighted relative flex h-full cursor-pointer items-center justify-center',
                'font-medium text-white transition-all duration-200 hover:brightness-110',
                index === 0 && 'rounded-l-[5px]',
                index === totalTokens.length - 1 && 'rounded-r-[5px]',
              )}
              style={{
                width: `${token.weight}%`,
              }}
              onMouseEnter={() => setHoveredToken(token)}
              onMouseLeave={() => setHoveredToken(null)}
            >
              {hoveredToken === token && (
                <div className='absolute -top-5 left-0 transform text-xs leading-4 text-nowrap text-neutral-50'>
                  {token.weight}% {token?.name === 'Wrapped BNB' ? 'WBNB' : token?.symbol || 'UNKNOWN'}
                </div>
              )}

              <div className='pointer-events-none flex h-full items-center justify-center'>
                <span className={cn('text-xs leading-4 text-neutral-500', hoveredToken === token && 'text-neutral-50')}>
                  {totalTokens.length < 3 ? token.weight : index + 1}
                </span>
              </div>

              {hoveredToken === token && (
                <div className='absolute top-5 left-0 transform text-xs leading-4 text-nowrap text-neutral-50'>
                  {`${formatAmount(token.amount)} ${
                    token?.name === 'Wrapped BNB' ? 'WBNB' : token?.symbol || 'UNKNOWN'
                  }`}
                </div>
              )}
            </div>
          )
        })}

        {(depositValue?.tokens || []).map((token, index) => {
          const totalTokens = depositValue?.tokens || []

          const leftPosition = (depositValue?.tokens || []).slice(0, index + 1).reduce((sum, t) => sum + t.weight, 0)

          if (index >= totalTokens.length - 1) return null

          return (
            <div
              key={`separator-${token.address}`}
              className='pointer-events-none absolute top-1/2 z-30 -translate-y-1/2 transform'
              style={{
                left: `${leftPosition}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <PolygonSmallIcon className='h-8 w-1.5 text-neutral-600 opacity-100' />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WeightedRange
