import React from 'react'

import { cn } from '@/lib/utils'

import ChevronDown from '~/svgs/chevron-down.svg'

export default function ChevronDownIcon({ className, isRevert = false, ...rest }) {
  return (
    <ChevronDown
      className={cn(
        'h-5 w-5 transform stroke-neutral-400! transition-all ease-in-out',
        className,
        isRevert ? 'rotate-180' : 'rotate-0',
      )}
      {...rest}
    />
  )
}
