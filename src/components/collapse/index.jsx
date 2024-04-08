'use client'

import React, { useState } from 'react'

import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

export function Collapse({ children, title, defaultShow = true, ...props }) {
  const [show, setShow] = useState(defaultShow)

  return (
    <div {...props}>
      <div onClick={() => setShow(!show)} className='flex items-center justify-between hover:cursor-pointer'>
        {title}
        <div className={cn('h-4 w-5', show ? 'rotate-180' : 'rotate-0')}>
          <ChevronDownIcon />
        </div>
      </div>
      <div className={cn('w-full', show ? 'h-full' : 'h-0 overflow-hidden')}>{children}</div>
    </div>
  )
}
