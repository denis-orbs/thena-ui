'use client'

import React from 'react'

import { cn } from '@/lib/utils'

import CircleImage from '../image/CircleImage'

function NewIconGroup({ logo1, logo2, className, classNames, size = 'title' }) {
  return (
    <div
      className={cn(
        'flex *:not-first:-ml-1 lg:*:not-first:-ml-2',
        size === 'title' && '*:not-first:-ml-2 lg:*:not-first:-ml-4',
        className,
      )}
    >
      <CircleImage
        className={cn(
          'size-7 rounded-full outline-1 outline-[#1C2027] outline-solid md:size-12 md:outline-2',
          size === 'subtitle' && 'md:size-10 2xl:size-12',
          size === 'title' && 'size-7 outline-2 md:size-12 md:outline-4',
          classNames?.image,
        )}
        src={logo1}
        alt='First Logo'
      />
      <CircleImage
        className={cn(
          'z-1 -ml-1 size-7 rounded-full outline-1 outline-[#1C2027] outline-solid md:-ml-2 md:size-12 md:outline-2',
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
