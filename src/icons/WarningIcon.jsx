import React from 'react'

import cn from '@/utils/classes'

import Warning from '~/svgs/warning-triangle.svg'

export default function WarningIcon({ className, ...rest }) {
  return <Warning className={cn('stroke-error-600 size-4', className)} {...rest} />
}
