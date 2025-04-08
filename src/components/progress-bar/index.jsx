import React from 'react'

import { cn } from '@/lib/utils'

import { Paragraph } from '../typography'

export function ProgressBar({ progress, suffix }) {
  return (
    <div
      className={cn(
        'flex h-6 w-full items-center justify-between overflow-hidden',
        'rounded-full border border-neutral-600 bg-neutral-800',
      )}
    >
      <div
        className={cn('h-full border-r-[3px] border-primary-300 transition-all ease-in-out', 'bg-progress-gradient')}
        style={{ width: `${progress}%` }}
      />
      {suffix && <Paragraph className='mr-4 lg:text-sm'>{suffix}</Paragraph>}
    </div>
  )
}
