import Image from 'next/image'
import React, { useState } from 'react'

import { cn } from '@/lib/utils'

import Skeleton from '../skeleton'

/**
 *
 * @description Must set width using `w-` className
 */
export default function NextImage({ src, alt, className, ...rest }) {
  const [status, setStatus] = useState('loading')

  if (!src) {
    return <Skeleton className={className} />
  }

  return (
    <Image
      className={cn(status === 'loading' && 'animate-pulse bg-neutral-600', className)}
      src={src}
      alt={alt}
      width={100}
      height={100}
      sizes='100vw'
      onLoad={() => setStatus('complete')}
      {...rest}
    />
  )
}
