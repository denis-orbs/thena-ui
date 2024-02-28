import React from 'react'

import { cn } from '@/lib/utils'

export function Paragraph({ children, className }) {
  return <span className={cn('text-neutral-300', className)}>{children}</span>
}

export function TextHeading({ children, className }) {
  return <span className={cn('font-medium text-neutral-50', className)}>{children}</span>
}

export function TextSubHeading({ children, className }) {
  return <span className={cn('text-sm text-neutral-500', className)}>{children}</span>
}
