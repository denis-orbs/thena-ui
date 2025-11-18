import React from 'react'

import ArrowDownIcon from '@/icons/ArrowDownIcon'
import cn from '@/utils/classes'

export default function PercentBadge({ value, isLarge = false }) {
  return (
    <div className='flex items-center gap-0.5'>
      <ArrowDownIcon
        className={cn(isLarge && 'size-6', value > 0 ? 'stroke-success-600 rotate-180' : 'stroke-error-600 rotate-0')}
      />
      <span
        className={cn(value > 0 ? 'text-success-600' : 'text-error-600', isLarge ? 'text-lg font-medium' : 'text-base')}
      >
        {value?.toFixed(2) || 0}%
      </span>
    </div>
  )
}
