import React from 'react'

import { cn } from '@/lib/utils'

import Info from '~/svgs/info-circle.svg'

export default function InfoIcon({ className, ...rest }) {
  return <Info className={cn('size-4 stroke-neutral-400', className)} {...rest} />
}
