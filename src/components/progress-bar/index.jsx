import React from 'react'

import { cn } from '@/lib/utils'

import { Paragraph } from '../typography'

export function ProgressBar({ progress, suffix }) {
  return (
    <div
      className={cn(
        'relative flex h-6 w-full items-center justify-between overflow-hidden',
        'rounded-full border border-neutral-600 bg-neutral-800',
      )}
    >
      <div
        className={cn(
          'absolute h-full border-r-[3px] border-primary-300 transition-all ease-in-out',
          'bg-progress-gradient',
        )}
        style={{ width: `${progress}%` }}
      />
      {suffix && <Paragraph className='z-10 mr-4 w-full text-end lg:text-sm'>{suffix}</Paragraph>}
    </div>
  )
}
