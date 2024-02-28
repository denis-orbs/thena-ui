'use client'

import React from 'react'

import { cn } from '@/lib/utils'

import CircleImage from '../image/CircleImage'

function IconGroup({ logo1, logo2, className, classNames }) {
  return (
    <div className={cn('flex items-center -space-x-4', className)}>
      <CircleImage
        className={cn('outline outline-4 outline-[#1C2027]', classNames?.image)}
        src={logo1}
        alt='THENA First Logo'
      />
      <CircleImage
        className={cn('z-1 rounded-full outline outline-4 outline-[#1C2027]', classNames?.image)}
        src={logo2}
        alt='THENA Second Logo'
      />
    </div>
  )
}

export default IconGroup
