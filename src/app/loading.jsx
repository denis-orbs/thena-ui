import React from 'react'

import Spinner from '@/components/spinner'
import { cn } from '@/lib/utils'

export default function Loading({ className = '' }) {
  // You can add any UI inside Loading, including a Skeleton.
  return <Spinner className={cn('absolute left-[50%] top-[50%] h-10 w-10', className)} />
}
