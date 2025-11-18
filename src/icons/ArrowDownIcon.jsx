import React from 'react'

import cn from '@/utils/classes'

import ArrowDown from '~/svgs/arrow-down.svg'

export default function ArrowDownIcon({ className }) {
  return <ArrowDown className={cn('size-4 stroke-neutral-400', className)} />
}
