import Image from 'next/image'
import React from 'react'

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

function GroupIconTokens({ tokens, width, height, poolAddress, className, showToolTip = true }) {
  const [firstRow, secondRow] = splitTokens(tokens)
  return (
    <div className={cn(secondRow.length > 0 && 'space-y-2', className)}>
      <div
        className='relative mx-auto flex w-fit items-center'
        style={{ width: width + (firstRow.length - 1) * (width * 0.6), height }}
      >
        {firstRow.map((token, index) => (
          <Image
            key={`${token.address}-${index}`}
            src={token.logoURI || UNKNOWN_LOGO}
            alt={`token-${index}`}
            className='absolute rounded-full border-2 border-[#1C2027] object-cover'
            style={{ left: index * (width * 0.6) }}
            width={width}
            height={height}
            data-tooltip-id={showToolTip ? `tooltip-token-${token.address}-${index}-${poolAddress}` : null}
          />
        ))}
      </div>
      {secondRow.length > 0 && (
        <div
          className='relative mx-auto flex w-fit items-center'
          style={{
            width: width + (secondRow.length - 1) * (width * 0.6),
            top: -height * 0.6,
            height,
          }}
        >
          {secondRow.map((token, index) => (
            <Image
              key={`${token.address}-${index}`}
              src={token.logoURI || UNKNOWN_LOGO}
              alt={`token-${index}`}
              className='absolute rounded-full border-2 border-[#1C2027] object-cover'
              style={{ left: index * (width * 0.6) }}
              width={width}
              height={height}
              data-tooltip-id={showToolTip ? `tooltip-token-${token.address}-${index}-${poolAddress}` : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default GroupIconTokens
