import React from 'react'

import { cn } from '@/lib/utils'

export function Paragraph({ children, className, title = undefined, ...props }) {
  return (
    <span className={cn('text-sm font-normal text-neutral-300 lg:text-base', className)} title={title} {...props}>
      {children}
    </span>
  )
}

export function TextHeading({ children, className, ...props }) {
  return (
    <span className={cn(['font-medium text-neutral-50'], className)} {...props}>
      {children}
    </span>
  )
}

export function TextSubHeading({ children, className }) {
  return <span className={cn('text-sm text-neutral-500', className)}>{children}</span>
}

export function NewTextHeading({ children, className, ...props }) {
  return (
    <span className={cn('font-archia text-3xl font-semibold text-neutral-50 md:text-5xl', className)} {...props}>
      {children}
    </span>
  )
}

export function NewTextSubHeading({ children, className, ...props }) {
  return (
    <span
      className={cn('text-base leading-4 font-medium text-neutral-50 md:text-2xl md:leading-8', className)}
      {...props}
    >
      {children}
    </span>
  )
}

export function NewParagraph({ children, className, title = undefined, ...props }) {
  return (
    <span
      className={cn('font-archia text-sm font-semibold text-neutral-50 md:text-base', className)}
      title={title}
      {...props}
    >
      {children}
    </span>
  )
}
