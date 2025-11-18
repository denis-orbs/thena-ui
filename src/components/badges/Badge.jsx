import React from 'react'

import cn from '@/utils/classes'

function Badge({ className, children, childrenClassName }) {
  return (
    <div className={cn('rounded-full text-xs lg:text-sm', className)}>
      <div className={cn('rounded-full bg-[#292929]/50 px-2 py-0.5 lg:px-3 lg:py-1', childrenClassName)}>
        {children}
      </div>
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

export function GreenBadge({ children, className }) {
  return <Badge className={cn('bg-success-600 text-success-100', className)}>{children}</Badge>
}

export function YellowBadge({ children, className }) {
  return <Badge className={cn('bg-warn-600 text-warn-100', className)}>{children}</Badge>
}

export function RedBadge({ children, className }) {
  return <Badge className={cn('bg-error-600 text-rose', className)}>{children}</Badge>
}

export function PrimaryBadge({ children, className, childrenClassName }) {
  return (
    <Badge className={cn('bg-primary-600 text-primary-100', className)} childrenClassName={childrenClassName}>
      {children}
    </Badge>
  )
}
