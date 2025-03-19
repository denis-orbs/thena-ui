import Image from 'next/image'
import React from 'react'

import { UNKNOWN_LOGO } from '@/constant'
import { cn } from '@/lib/utils'

import CustomTooltip from '../tooltip'

const splitTokens = tokens => {
  const total = tokens.length
  if (total <= 4) return [tokens, []]
  const mid = Math.ceil(total / 2)

  if (total === 5) return [tokens.slice(0, 3), tokens.slice(3)]
  if (total === 7) return [tokens.slice(0, 4), tokens.slice(4)]
  return [tokens.slice(0, mid), tokens.slice(mid)]
}

function GroupIconTokens({ tokens, width, height, poolAddress, className, showToolTip = true, classNames }) {
  const [firstRow, secondRow] = splitTokens(tokens)
  return (
    <div className='h-fit'>
      <div className={cn(className)} style={{ height: secondRow.length > 0 ? height * 1.75 : height }}>
        <div
          className='relative mx-auto flex w-fit items-center'
          style={{ width: width + (firstRow.length - 1) * (width * 0.75), height }}
        >
          {firstRow.map((token, index) => (
            <React.Fragment key={`${token.address}-${index}`}>
              <Image
                key={`${token.address}-${index}`}
                src={token.logoURI || UNKNOWN_LOGO}
                alt={`token-${index}`}
                className={cn(
                  'absolute rounded-full border-[#1C2027] bg-neutral-50 object-cover shadow-[0_0_0_calc(0.09_*_var(--size))_#1C2027]',
                )}
                style={{ left: index * (width * 0.75), '--size': `${width}px` }}
                width={width}
                height={height}
                data-tooltip-id={showToolTip ? `tooltip-token-${token.address}-${index}-${poolAddress}` : null}
              />
              {showToolTip && (
                <CustomTooltip
                  className={cn('z-40 w-fit !bg-neutral-500 shadow-xl after:!bg-neutral-500', classNames?.toolTip)}
                  id={`tooltip-token-${token.address}-${index}-${poolAddress}`}
                  place='top'
                >
                  {`${token.symbol || 'UNKNOWN'} ${token.weight}%`}
                </CustomTooltip>
              )}
            </React.Fragment>
          ))}
        </div>
        {secondRow.length > 0 && (
          <div
            className='relative mx-auto flex w-fit items-center'
            style={{
              width: width + (secondRow.length - 1) * (width * 0.75),
              top: -height * 0.25,
              height,
            }}
          >
            {secondRow.map((token, index) => (
              <React.Fragment key={`${token.address}-${index}`}>
                <Image
                  key={`${token.address}-${index}`}
                  src={token.logoURI || UNKNOWN_LOGO}
                  alt={`token-${index}`}
                  className={cn(
                    'absolute rounded-full border-[#1C2027] bg-neutral-50 object-cover shadow-[0_0_0_calc(0.09_*_var(--size))_#1C2027]',
                  )}
                  style={{ left: index * (width * 0.75), '--size': `${width}px` }}
                  width={width}
                  height={height}
                  data-tooltip-id={showToolTip ? `tooltip-token-${token.address}-${index}-${poolAddress}` : null}
                />
                {showToolTip && (
                  <CustomTooltip
                    className={cn('z-40 w-fit !bg-neutral-500 shadow-xl after:!bg-neutral-500', classNames?.toolTip)}
                    id={`tooltip-token-${token.address}-${index}-${poolAddress}`}
                    place='top'
                  >
                    {`${token.symbol || 'UNKNOWN'} ${token.weight}%`}
                  </CustomTooltip>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupIconTokens
