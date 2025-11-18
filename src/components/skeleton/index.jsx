import React from 'react'

import cn from '@/utils/classes'

export default function Skeleton({ className, ...props }) {
  return <div className={cn('h-full w-full animate-pulse rounded-md bg-neutral-600', className)} {...props} />
}
