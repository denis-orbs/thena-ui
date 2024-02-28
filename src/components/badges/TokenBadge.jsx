import React from 'react'

import { CompTypes } from '@/constant/type'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

import CircleImage from '../image/CircleImage'
import Skeleton from '../skeleton'

export default function TokenBadge({ className, asset, variant = CompTypes.Emphasis, ...rest }) {
  return (
    <div
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 self-stretch',
        'outline outline-2 outline-offset-4 outline-transparent',
        'rounded-full text-sm text-neutral-200 transition-all duration-150 ease-out',
        'active:bg-neutral-600 active:outline-focus',
        'py-1.5 pl-1.5 pr-2',
        variant === CompTypes.Primary && [
          'bg-primary-600 text-primary-100',
          'hover:bg-primary-700 hover:text-primary-200',
          'active:bg-primary-600 active:text-primary-100',
        ],
        variant === CompTypes.Emphasis && [
          'bg-neutral-600 text-neutral-200',
          'hover:bg-neutral-700 hover:text-neutral-100',
          'active:bg-neutral-600 active:text-neutral-200',
        ],
        className,
      )}
      {...rest}
    >
      {asset ? (
        <>
          <CircleImage src={asset.logoURI} alt='token logo' width={24} height={24} />
          {asset.symbol}
        </>
      ) : (
        <Skeleton className='h-6 w-6 rounded-full' />
      )}
      <ChevronDownIcon className='h-4 w-4' />
    </div>
  )
}
