import React from 'react'

import { cn } from '@/lib/utils'
import { ArrowDownIcon } from '@/svgs'

export default function PercentBadge({ value }) {
  return (
    <div className='flex items-center gap-0.5'>
      <ArrowDownIcon
        className={cn(
          'transfrom h-4 w-4 cursor-pointer stroke-neutral-400 transition-all duration-150 ease-out',
          value > 0 ? 'rotate-180 stroke-success-600' : 'rotate-0 stroke-error-600',
        )}
      />
      <span className={cn('text-base', value > 0 ? 'text-success-600' : 'text-error-600')}>
        {value?.toFixed(2) || 0}%
      </span>
    </div>
  )
}
