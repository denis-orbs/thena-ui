import React from 'react'

import { cn } from '@/lib/utils'

function Badge({ className, children }) {
  return (
    <div className={cn('rounded-full text-xs lg:text-sm', className)}>
      <div className='rounded-full bg-[#292929] bg-opacity-50 px-2 py-0.5 lg:px-3 lg:py-1'>{children}</div>
    </div>
  )
}

export function NeutralBadge({ className, children, isFixed = false }) {
  return (
    <div
      className={cn(
        'h-fit rounded-full bg-neutral-600 px-2 py-0.5 text-xs text-neutral-200 lg:px-3 lg:py-1 lg:text-sm',
        isFixed && 'px-3 py-1 text-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function GreenBadge({ children }) {
  return <Badge className='bg-success-600 text-success-100'>{children}</Badge>
}

export function YellowBadge({ children }) {
  return <Badge className='bg-warn-600 text-warn-100'>{children}</Badge>
}

export function RedBadge({ children }) {
  return <Badge className='bg-error-600 text-rose'>{children}</Badge>
}

export function PrimaryBadge({ children }) {
  return <Badge className='bg-primary-600 text-primary-100'>{children}</Badge>
}
