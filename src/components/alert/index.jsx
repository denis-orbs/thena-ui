import React from 'react'

import { cn } from '@/lib/utils'

export function Info({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-primary-800 bg-primary-950 p-2 pl-3 text-primary-100',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Warning({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-warn-900 bg-warn-950 p-2 pl-3 text-warn-100',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Alert({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-error-800 bg-error-950 p-2 pl-3 text-rose',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Neutral({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border border-neutral-600 bg-neutral-900 p-2 pl-3 lg:p-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
