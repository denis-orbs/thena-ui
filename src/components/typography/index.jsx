import React from 'react'

import { cn } from '@/lib/utils'

export function Paragraph({ children, className, title = undefined }) {
  return (
    <span className={cn('text-neutral-300', className)} title={title}>
      {children}
    </span>
  )
}

export function TextHeading({ children, className, ...props }) {
  return (
    <span className={cn('font-medium text-neutral-50', className)} {...props}>
      {children}
    </span>
  )
}

export function TextSubHeading({ children, className }) {
  return <span className={cn('text-sm text-neutral-500', className)}>{children}</span>
}

export function NewTextHeading({ children, className, ...props }) {
  return (
    <span
      className={cn('font-archia text-3xl font-semibold text-neutral-50 lg:text-5xl 2xl:text-8xl', className)}
      {...props}
    >
      {children}
    </span>
  )
}

export function NewTextSubHeading({ children, className, ...props }) {
  return (
    <span className={cn('font-archia text-xl font-semibold text-neutral-50 lg:text-3xl', className)} {...props}>
      {children}
    </span>
  )
}
