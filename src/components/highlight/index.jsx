import React from 'react'

import { cn } from '@/lib/utils'
import { ShadowIcon } from '@/svgs'

function Highlight({ children, className }) {
  return (
    <div className='border-opacity-10 bg-opacity-5 relative inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white bg-white p-1.5'>
      <div
        className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md bg-neutral-600 shadow-sm', className)}
      >
        <ShadowIcon className='absolute top-[18px] h-10 w-20 rounded-full blur-md' />
        {children}
      </div>
    </div>
  )
}
export default Highlight
