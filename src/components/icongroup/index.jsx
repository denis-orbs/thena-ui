'use client'

import React from 'react'

import { cn } from '@/lib/utils'

import CircleImage from '../image/CircleImage'

function IconGroup({ logo1, logo2, width, height, className, classNames }) {
  return (
    <div className={cn('flex items-center *:not-first:-ml-4', className)}>
      <CircleImage
        className={cn('outline-4 outline-[#1C2027] outline-solid', classNames?.image)}
        src={logo1}
        alt='THENA First Logo'
        width={width}
        height={height}
      />
      <CircleImage
        className={cn('z-1 rounded-full outline-4 outline-[#1C2027] outline-solid', classNames?.image)}
        src={logo2}
        alt='THENA Second Logo'
        width={width}
        height={height}
      />
    </div>
  )
}

export default IconGroup
