import React from 'react'
import { Tooltip } from 'react-tooltip'

import { cn } from '@/lib/utils'

function CustomTooltip({ children, className, id, place = 'top' }) {
  return (
    <Tooltip
      id={id}
      place={place}
      className={cn('relative rounded-lg !bg-neutral-700 !p-3 !opacity-100 after:!bg-neutral-700', className)}
    >
      {children}
    </Tooltip>
  )
}

export default CustomTooltip
