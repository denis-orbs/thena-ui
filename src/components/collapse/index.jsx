'use client'

import React, { useState } from 'react'

import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

import { TextHeading } from '../typography'

export function Collapse({ children, title, ...props }) {
  const [show, setShow] = useState(true)

  return (
    <div {...props}>
      <div onClick={() => setShow(!show)} className='flex items-center justify-between hover:cursor-pointer'>
        <TextHeading className='text-xl'>{title}</TextHeading>
        <div className={cn('h-4 w-5', show ? 'rotate-180' : 'rotate-0')}>
          <ChevronDownIcon />
        </div>
      </div>
      <div className={cn('w-full', show ? 'h-full' : 'h-0 overflow-hidden')}>{children}</div>
    </div>
  )
}
