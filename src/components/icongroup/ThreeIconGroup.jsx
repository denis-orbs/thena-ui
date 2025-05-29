'use client'

import React from 'react'

import { cn } from '@/lib/utils'

import CircleImage from '../image/CircleImage'

export function ThreeIconGroup({ logo1, logo2, extendNumber, className, classNames }) {
  return (
    <div className={cn('flex items-center -space-x-4', className)}>
      <CircleImage
        className={cn('outline-4 outline-[#1C2027] outline-solid', classNames?.image)}
        src={logo1}
        alt='THENA First Logo'
      />
      <CircleImage
        className={cn('z-1 rounded-full outline-4 outline-[#1C2027] outline-solid', classNames?.image)}
        src={logo2}
        alt='THENA Second Logo'
      />
      {extendNumber > 0 && (
        <div
          className={cn(
            'logo z-2 flex items-center justify-center rounded-full bg-neutral-200 outline-4 outline-[#1C2027] outline-solid',
            classNames?.image,
          )}
        >
          <span className='text-[#1C2027]'>+{extendNumber}</span>
        </div>
      )}
    </div>
  )
}
