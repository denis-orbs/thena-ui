import React from 'react'

import cn from '@/utils/classes'

import ChevronRight from '~/svgs/chevron-right.svg'

export default function ChevronRightIcon({ className, ...rest }) {
  return <ChevronRight className={cn('h-4 w-4', className)} {...rest} />
}
