'use client'

import React from 'react'

import { cn } from '@/lib/utils'

import CircleImage from '../image/CircleImage'

function NewIconGroup({ logo1, logo2, className, classNames, size = 'title' }) {
  return (
    <div className={cn('flex -space-x-1 lg:-space-x-2', size === 'title' && '-space-x-2 lg:-space-x-4', className)}>
      <CircleImage
        className={cn(
          'size-7 rounded-full outline outline-1 outline-[#1C2027] md:size-12 md:outline-2',
          size === 'subtitle' && 'md:size-10 2xl:size-12',
          size === 'title' && 'size-7 outline-2 md:size-12 md:outline-4',
          classNames?.image,
        )}
        src={logo1}
        alt='First Logo'
      />
      <CircleImage
        className={cn(
          'z-1 -ml-1 size-7 rounded-full outline outline-1 outline-[#1C2027] md:-ml-2 md:size-12 md:outline-2',
          size === 'subtitle' && 'md:-ml-4 md:size-10 2xl:-ml-5 2xl:size-12',
          size === 'title' && '-ml-2 size-7 outline-2 md:-ml-5 md:size-12 md:outline-4',
          classNames?.image,
        )}
        src={logo2}
        alt='Second Logo'
      />
    </div>
  )
}

export default NewIconGroup
