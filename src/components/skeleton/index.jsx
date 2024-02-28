import React from 'react'

import { cn } from '@/lib/utils'

export default function Skeleton({ className }) {
  return <div className={cn('h-full w-full animate-pulse rounded-md bg-neutral-600', className)} />
}
