'use client'

import React from 'react'

import cn from '@/utils/classes'

import CircleImage from '../image/CircleImage'

export function ThreeIconGroup({ logo1, logo2, extendNumber, className, classNames }) {
  return (
    <div className={cn('flex items-center *:not-first:-ml-4', className)}>
      <CircleImage
        className={cn('outline-none', classNames?.image)}
        style={{ border: '4px solid rgba(26, 13, 31, 0.2)' }}
        src={logo1}
        alt='THENA First Logo'
      />
      <CircleImage
        className={cn('z-1 rounded-full outline-none', classNames?.image)}
        src={logo2}
        alt='THENA Second Logo'
        style={{ border: '4px solid rgba(26, 13, 31, 0.2)' }}
      />
      {extendNumber > 0 && (
        <div
          className={cn(
            'logo z-2 flex items-center justify-center rounded-full bg-neutral-200 outline-none',
            classNames?.image,
          )}
          style={{ border: '4px solid rgba(26, 13, 31, 0.2)' }}
        >
          <span className='text-[#1C2027]'>+{extendNumber}</span>
        </div>
      )}
    </div>
  )
}
