import React from 'react'

import { cn } from '@/lib/utils'

import ArrowLeft from '~/svgs/arrow-left.svg'

export default function ArrowLeftIcon({ className }) {
  return <ArrowLeft className={cn('size-4', className)} />
}
