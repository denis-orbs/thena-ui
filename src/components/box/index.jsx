import React from 'react'

import { cn } from '@/lib/utils'

function Box({ children, className, ...rest }) {
  return (
    <div className={cn('rounded-xl bg-neutral-900 px-4 py-6 lg:p-6', className)} {...rest}>
      {children}
    </div>
  )
}

export default Box
