import Image from 'next/image'
import React, { memo, useCallback, useState } from 'react'

import cn from '@/utils/classes'

import Skeleton from '../skeleton'

/**
 *
 * @description Must set width using `w-` className
 */
function NextImage({ src, alt = 'thena image', className, ...rest }) {
  const [status, setStatus] = useState('loading')

  const handleLoad = useCallback(() => setStatus('complete'), [])

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
      onLoad={handleLoad}
      {...rest}
    />
  )
}

export default memo(NextImage)
