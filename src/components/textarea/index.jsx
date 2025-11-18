import React from 'react'

import cn from '@/utils/classes'

export function TextArea({ className, ...rest }) {
  return (
    <textarea
      lang='en'
      className={cn(
        'w-full resize rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500',
        className,
      )}
      {...rest}
    />
  )
}
