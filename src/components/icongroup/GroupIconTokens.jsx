import Image from 'next/image'
import React from 'react'

import CustomTooltip from '@/components/tooltip'
import { UNKNOWN_LOGO } from '@/constant'
import { cn } from '@/lib/utils'

const splitTokens = tokens => {
  const total = tokens.length
  if (total <= 4) return [tokens, []]
  const mid = Math.ceil(total / 2)

  if (total === 5) return [tokens.slice(0, 3), tokens.slice(3)]
  if (total === 7) return [tokens.slice(0, 4), tokens.slice(4)]
  return [tokens.slice(0, mid), tokens.slice(mid)]
}

function GroupIconTokens({ tokens, width, height, poolAddress, className, classNames = {}, showToolTip = true }) {
  const [firstRow, secondRow] = splitTokens(tokens)
  return (
    <div className={cn(secondRow.length > 0 && '-space-y-2', className)}>
      <div className={cn('flex items-center -space-x-4', classNames.rows)}>
        {firstRow.map((token, index) => (
          <React.Fragment key={`${token.address}-${index}`}>
            <Image
              src={token.logoURI || UNKNOWN_LOGO}
              alt={`token-${index}`}
              className={cn('rounded-full border-2 border-[#1C2027] object-cover', classNames.images)}
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
        <div className={cn('relative mx-auto flex w-fit items-center -space-x-2', classNames.rows)}>
          {secondRow.map((token, index) => (
            <React.Fragment key={`${token.address}-${index}`}>
              <Image
                src={token.logoURI || UNKNOWN_LOGO}
                alt={`token-${index}`}
                className={cn('rounded-full border-2 border-[#1C2027] object-cover', classNames.images)}
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
  )
}

export default GroupIconTokens
